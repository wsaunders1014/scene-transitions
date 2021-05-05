/************************
 * Scene Transitions
 * Origianl Author: @WillS
 * Maintained by @WillS and @DM_miX
*************************/


const stmod = 'scene-transitions';
let sceneID = null;
const PATH = "modules/scene-transitions";
const exampleText = `You set out from Neverwinter, eager for your first adventure. The cart moves at a steady pace across the grasslands. Merchants pass in caravans, and the odd sighting of patrols of the City Guard become sparser as you move away from the city.

After almost two days of travel, your horses come to an abrupt stop and begin to stamp their feet nervously. A hundred feet ahead in the trail, a pair of dead horses lay in the road, riddled with black arrows. 

The woods around you are eerily silent.`;

const DEFAULT_CONFIG = {
	sceneTransition:{
		form:{
			title:{
				create:'Create Transition',
				edit:'Edit Transition'
			}
		}
	}
}

let scenetransitions = {
    playingAudio: new Sound(),
    transitionForm: null,
    activeTransition: null
}


//let transitionForm;
//let activeTransition;







/**
 * The magic happens here
 * @param preview: 
 * @param sceneID: The scene to transition to
 * @param options: See default options below for a list of all available
 */
class Transition {
	constructor(preview, sceneID = false, options){
		this.preview = preview;
		this.sceneID = sceneID;
		this.options = mergeObject(this.constructor.defaultOptions, options || {});
		
		this.journal = null;
		this.modal = null;
		this.timeout = null;
		this.audio = null;
		this.users = null;
	}	
	
	static get defaultOptions(){
		return{
			fontColor:'#ffffff',
			fontSize:'28px',
			bgImg:'',
			bgPos:'center center',
			bgSize:'cover',
			bgColor:'#000000',
			bgOpacity:0.7,
			fadeIn: 400,
			delay:4000,
			fadeOut:1000,
			volume: 1.0,
			skippable:true,
			content:""
		}
	}

    createFromJournal(journalID){
        //todo
    }

	render(){
		//$('body').append('<div id="transition" class="transition"><div class="transition-bg"></div><div class="transition-content"></div><audio><source src=""></audio></div>');
        $('body').append('<div id="transition" class="transition"><div class="transition-bg"></div><div class="transition-content"></div></div>');

		this.modal = $('#transition');
		this.modal.css({backgroundColor:this.options.bgColor})
		this.modal.find('.transition-bg').css({backgroundImage:'url('+this.options.bgImg+')',opacity:this.options.bgOpacity,backgroundSize:this.options.bgSize,backgroundPosition:this.options.bgPos})
		this.modal.find('.transition-content').css({color:this.options.fontColor,fontSize:this.options.fontSize}).html(this.options.content);
        
		if(this.options.audio){
			//this.audio = this.modal.find('audio')[0];
			//this.modal.find('audio').attr('src',this.options.audio);
			//this.audio.load();
            //this.audio.volume = this.options.volume.toFixed(1);
			//this.audio.play();]

            AudioHelper.play({src: this.options.audio, volume: this.options.volume, loop: false}, false).then( function(audio) {
                scenetransitions.playingAudio = audio; // a ref for fading later
            });
		}

		this.modal.fadeIn(this.options.fadeIn,()=>{
			if(game.user.isGM && !this.preview && this.sceneID !==false) {   
				game.scenes.get(this.sceneID).activate();
            }
			this.modal.find('.transition-content').fadeIn();
			if(!this.preview)
				this.setDelay();
		})
		if(this.options.skippable && !this.preview){
			this.modal.on('click',()=>{
				this.destroy()
			})
		}
	}

	setDelay(){
		this.timeout = setTimeout(function(){
			this.destroy()
		}.bind(this),this.options.delay)
	}

	destroy(instant=false){
		
        let time = (instant) ? 0:this.options.fadeOut;
		clearTimeout(this.timeout);
		if(scenetransitions.playingAudio !== null) this.fadeAudio(scenetransitions.playingAudio, time);
		this.modal.fadeOut(time,()=>{
			this.modal.remove();
			this.modal = null;
		})
	}

	updateData(newData){
		this.options = mergeObject(this.options,newData);
		
		return this;

	}

	playSound(){

	}

	getJournalText(){
		return this.journal.content;
	}

	getJournalImg(){
		return this.journal.img;
	}

	fadeAudio(audio, time){
        if(!audio) {
            return;
        }

        if(time == 0) {
            audio.stop();
            return;
        }
	
        
        let volume = audio.gain.value;
        let targetVolume = 0.000001;
        let speed = volume / time * 50;  
        audio.gain.value = volume;
        let fade = function() {
            volume -= speed;
            audio.gain.value = volume.toFixed(6);
            console.log(audio.gain.value)
            if(volume.toFixed(6) <= targetVolume){
                audio.stop();
                clearInterval(audioFadeTimer);
            };
        }
        fade();
        let audioFadeTimer = setInterval(fade,50);
		

        /*
        if(time == 0) return;
		if(audio.volume){
			let volume = audio.volume;
			let targetVolume = 0;
			let speed = volume / time * 100;  
			audio.volume = volume;
			let fade = function() {
				volume -= speed;
				audio.volume = volume.toFixed(1);
				if(volume.toFixed(1) <= targetVolume){
					clearInterval(audioFadeTimer);
				};
			}
			fade();
			let audioFadeTimer = setInterval(fade,100);
		};
        */

	};
}






/**
 * Form controller for editing transitions
 */
class TransitionForm extends FormApplication {
 	constructor(object, options) {
        super(object, options);
        this.transition = object || {}
        this.data = {};
        this.interval = null;
       // this.editors['content']={options:{}}
    }

    /**
     * 
     */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "transition-form",
            title: DEFAULT_CONFIG.sceneTransition.form.title.create,
            template: `${PATH}/templates/transition-form.html`,
            classes: ["sheet","transition-form"],
            height:500,
           	width:436
        });
    }

    /**
     * Get data for the triggler form
     */
    getData(options){

         let transition = this.transition.options;
         return transition;
    }
    updatePreview(){
    	const w = window.innerWidth;
    	const h = window.innerHeight;
    	
    	const preview = $('#transition')
    	preview.find('.transition-bg').css({backgroundImage:'url('+this.transition.options.bgImg+')',opacity:this.transition.options.bgOpacity,backgroundColor:this.transition.options.bgColor});
    	preview.find('.transition-content').css({color:this.transition.options.fontColor})
    }

    async activateEditor(name, options={}, initialContent="") {
        const editor = this.editors[name];
        if ( !editor ) throw new Error(`${name} is not a registered editor name!`);
        options = mergeObject(editor.options, options);
        options.height = options.target.offsetHeight;
        await TextEditor.create(options, initialContent || editor.initial).then(mce => {
          editor.mce = mce;
          editor.changed = false;
          editor.active = true;
          //mce.focus();
          mce.on('change', ev => editor.changed = true);
        });
        return true;
    }
    async _activateEditor(div) {

        // Get the editor content div
        const name = div.getAttribute("data-edit");
        const button = div.nextElementSibling;
        const hasButton = button && button.classList.contains("editor-edit");
        const wrap = div.parentElement.parentElement;
        const wc = $(div).parents(".window-content")[0];

        // Determine the preferred editor height
        const heights = [wrap.offsetHeight, wc ? wc.offsetHeight : null];
        if ( div.offsetHeight > 0 ) heights.push(div.offsetHeight);
        let height = Math.min(...heights.filter(h => Number.isFinite(h)));

        // Get initial content
        //const data = this.object instanceof Entity ? this.object.data : this.object;
        const data = this.object;
        const initialContent = getProperty(data, name);
        const editorOptions = {
          target: div,
          height: height,
          save_onsavecallback: mce => this.saveEditor(name)
        };

        // Add record to editors registry
        this.editors[name] = {
          target: name,
          button: button,
          hasButton: hasButton,
          mce: null,
          active: !hasButton,
          changed: false,
          options: editorOptions,
          initial: initialContent
        };

        // If we are using a toggle button, delay activation until it is clicked
        // if (hasButton) button.onclick = event => {
        //   button.style.display = "none";
        //   await this.activateEditor(name, editorOptions, initialContent);
        // };

        // Otherwise activate immediately
       // else await this.activateEditor(name, editorOptions, initialContent);
        
        return true;
    }


    activateListeners(html) {
        super.activateListeners(html);
     	//this.updatePreview();
        html.on("change", "input,select,textarea", this._onChangeInput.bind(this));
        const bgImageInput = html.find('input[name="bgImg"]');
        const bgOpacityInput = html.find('input[name="bgOpacity"]');
        const bgSizeInput = html.find('input[name="bgSize"]');
        const bgPosInput = html.find('input[name="bgPos"]');
        const fontSizeInput = html.find('input[name="fontSize"]')
        const textEditor = html.find('.mce-content-body');
        const volumeSlider = html.find('input[name="volume"]');
        
        const preview = $('#transition');
        bgSizeInput.on('change', e =>{
            this.data.bgSize = e.target.value;
            preview.find('.transition-bg').css('background-size',this.data.bgSize)
        });
        bgPosInput.on('change', e =>{
            this.data.bgPos = e.target.value;
            preview.find('.transition-bg').css('background-position',this.data.bgPos)
        });
        bgImageInput.on('change', e =>{
        	this.data.bgImg = e.target.value;
        	preview.find('.transition-bg').css('background-image',`url(${this.data.bgImg})`)
        });
        bgOpacityInput.on('change', e =>{
        	this.data.bgOpacity = e.target.value;
        	preview.find('.transition-bg').css('opacity',e.target.value)
        })
        fontSizeInput.on('change', e => {
        	preview.find('.transition-content').css('font-size',e.target.value);
        })
        html.find('button[name="cancel"]').on('click',()=>{
       		this.close();
        })
        html.find('button[name="save"]').on('click',()=>{
            this._onSubmit();
        })
        volumeSlider.on('change', e => {
            //preview.find('audio')[0].volume = e.target.value
            if(scenetransitions.playingAudio.playing) {
            scenetransitions.playingAudio.gain.value = e.target.value
            }

        })


        this._activateEditor(html.find('.editor-content')[0]).then(async ()=>{
            await this.activateEditor('content', this.editors.content.options, this.editors.content.initial);
         
            this.editors.content.mce.on('focus',(e)=>{
               
                this.interval = setInterval(()=>{
                    
                    preview.find('.transition-content').html(this.editors.content.mce.getBody().innerHTML)
                },500)
            })
            this.editors.content.mce.on('blur', e=>{
                clearInterval(this.interval);
            })
        
            
        })
    }


    close() {
        scenetransitions.playingAudio.stop();
        super.close()
    }
   
        
    async _onSubmit(event, {updateData=null, preventClose=false, preventRender=false}={}) {
        
        const states = this.constructor.RENDER_STATES;
        if ( (this._state === states.NONE) || !this.options.editable || this._submitting ) return false;
        this._submitting = true;

        if(scenetransitions.playingAudio.playing) {
            scenetransitions.playingAudio.stop();
        }

	    // Acquire and validate Form Data
	    const form = this.element.find("form").first()[0];

        // Flag if the application is staged to close to prevent callback renders
        const priorState = this._state;
        if ( this.options.closeOnSubmit ) this._state = states.CLOSING;
        if ( preventRender && (this._state !== states.CLOSING )) this._state = states.RENDERING;

        // Trigger the object update
        const formData = this._getSubmitData(updateData);
       
	   
	    this.transition.updateData(formData);
	    if(sceneID != false)
	       game.scenes.get(this.transition.sceneID).setFlag('scene-transitions','transition',this.transition)
	  
	    this._submitting = false;
        this._state = priorState;
        if ( this.options.closeOnSubmit && !preventClose ) this.close({submit: false});
        return formData;
	}

    _onChangeColorPicker(event) {
    	const input = event.target;
    	const form = input.form;
    	

    	form[input.dataset.edit].value = input.value;
    	if($(input).attr('data-edit') == 'bgColor'){
    		this.data.bgColor = event.target.value;
    		$('#transition').css('background-color',event.target.value)
    	}else if($(input).attr('data-edit') == 'fontColor'){
    		$('#transition').find('.transition-content').css('color',event.target.value)
    	}
    }

    async _updateObject(event, formData) {
    	return true;
   	}
     
}


/********************
 * Hooks for running Transitions
 *******************/
Hooks.on('init',() => {;
	console.log('Scene Transition')

    game.settings.register("scene-transitions", "show-journal-header-transition", {
        name: "Show Play as Transition in Journal window",
        hint: "",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });


	game.socket.on('module.scene-transitions', async (data) => {
		console.log(data.sceneID,data.options);
		if (!data.users || data.users.contains(game.userId)) {
			new Transition(false,data.sceneID, data.options).render();
		}
	})
   
});
Hooks.on('closeTransitionForm', (form)=>{
	scenetransitions.activeTransition.destroy(true);
	scenetransitions.activeTransition = null;
	clearInterval(form.interval);
})

Hooks.on('ready',()=>{
    $('body').on('click','.play-transition', (e)=>{
        
        let id = $(e.target).parents('.journal-sheet').attr('id').split('-')[1];
        let journal = game.journal.get(id).data;
        let options = {
            content:journal.content,
            bgImg:journal.img
        }
        scenetransitions.activeTransition = new Transition(false, false, options)
        scenetransitions.activeTransition.render()
        let data = {sceneID:false,options:options}
        game.socket.emit('module.scene-transitions', data);
    });
})






/********************
 * Button functions for Foundry menus and window headers
 *******************/
function addPlayTransitionBtn(idField) {
    return {
        name: "Play Transition",
        icon: '<i class="fas fa-play-circle"></i>',
        condition: li => {
        	
        	if(game.user.isGM && typeof game.scenes.get(li.data(idField)).getFlag('scene-transitions','transition') =='object')
        		return true;
        },
        callback: li => {	
         	let sceneID = li.data(idField);
         	game.scenes.preload(sceneID, true);
        	scenetransitions.activeTransition = new Transition(false, sceneID, game.scenes.get(li.data(idField)).getFlag('scene-transitions','transition').options )
        	scenetransitions.activeTransition.render()
            let data = {sceneID:sceneID,options:game.scenes.get(li.data(idField)).getFlag('scene-transitions','transition').options}
            game.socket.emit('module.scene-transitions', data);
            
        }
    };
}


function addCreateTransitionBtn(idField) {
    return {
        name: "Create Transition",
        icon: '<i class="fas fa-plus-square"></i>',
        condition: li => {
       
        	if(game.user.isGM && !game.scenes.get(li.data(idField)).getFlag('scene-transitions','transition'))
        		return true;
        },
        callback: li => {
        	let sceneID = li.data(idField);   
           
          	scenetransitions.activeTransition = new Transition(true,sceneID)
          	scenetransitions.activeTransition.render()
          	scenetransitions.transitionForm = new TransitionForm(scenetransitions.activeTransition).render(true);
        }
    };
}


function addEditTransitionBtn(idField) {
    return {
        name: "Edit Transition",
        icon: '<i class="fas fa-edit"></i>',
        condition: li => {
        	
        	if(game.user.isGM && game.scenes.get(li.data(idField)).getFlag('scene-transitions','transition'))
        		return true;
        },
        callback: li => {
        	let scene = game.scenes.get(li.data(idField));   
          	scenetransitions.activeTransition = new Transition(true,li.data(idField),scene.getFlag('scene-transitions','transition').options)
          	scenetransitions.activeTransition.render()
          	
          	scenetransitions.transitionForm = new TransitionForm(scenetransitions.activeTransition).render(true);
        }
    };
}


function addDeleteTransitionBtn(idField) {	
    return {
        name: "Delete Transition",
        icon: '<i class="fas fa-trash-alt"></i>',
        condition: li => {
        
        	if(game.user.isGM && game.scenes.get(li.data(idField)).getFlag('scene-transitions','transition'))
        		return true;
        },
        callback: li => {
        	let scene = game.scenes.get(li.data(idField));   
           
          	scene.unsetFlag('scene-transitions','transition');

        }
    };
}


function addPlayTransitionBtnJE(idField) {
    return {
        name: "Play Transition From Journal",
        icon: '<i class="fas fa-play-circle"></i>',
        condition: li => {
            
            if(game.user.isGM)
                return true;
        },
        callback: li => {

            let id = li.data(idField);

            let journal = game.journal.get(id).data;
            let options = {
                content:journal.content,
                bgImg:journal.img
            }
            scenetransitions.activeTransition = new Transition(false, false, options)
            scenetransitions.activeTransition.render()
            let data = {sceneID:false,options:options}
            game.socket.emit('module.scene-transitions', data);
            
        }
    };
}



/********************
 * Adds menu option to Scene Nav and Directory
 *******************/
//Credit to Winks' Everybody Look Here for the code to add menu option to Scene Nav
Hooks.on("getSceneNavigationContext", (html, contextOptions) => {
    contextOptions.push(addPlayTransitionBtn('sceneId'));
    contextOptions.push(addCreateTransitionBtn('sceneId'));
    contextOptions.push(addEditTransitionBtn('sceneId'));
    contextOptions.push(addDeleteTransitionBtn('sceneId'));
});

Hooks.on("getSceneDirectoryEntryContext", (html, contextOptions) => {
    contextOptions.push(addPlayTransitionBtn('entityId'));
    contextOptions.push(addCreateTransitionBtn('entityId'));
    contextOptions.push(addEditTransitionBtn('entityId'));
    contextOptions.push(addDeleteTransitionBtn('entityId'));
});

Hooks.on('getJournalDirectoryEntryContext', (html,contextOptions)=>{
    contextOptions.push(addPlayTransitionBtnJE('entityId'));
});

Hooks.on('renderJournalSheet', (journal)=>{
    if(game.user.isGM && $('#'+journal.id+' > header').find('.play-transition').length == 0 && game.settings.get("scene-transitions", "show-journal-header-transition") == true) {
         $('<a class="play-transition"><i class="fas fa-play-circle"></i> Play as Transition</a>').insertAfter('#'+journal.id+' > header > h4');
    }
})






