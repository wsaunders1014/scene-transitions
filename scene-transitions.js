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


let transitionForm;
let activeTransition;
class Transition {
	constructor(preview,sceneID,options){
		this.preview = preview;
		this.sceneID = sceneID;
		this.options = mergeObject(this.constructor.defaultOptions, options || {});
		
		this.journal = null;
		this.modal = null;
		this.timeout = null;
		this.audio = null;
        console.log(this.options,options)
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
			delay:5000,
			skippable:true,
			content:""

		}
	}
    createFromJournal(journalID){

    }
	render(){
		$('body').append('<div id="transition" class="transition"><div class="transition-bg"></div><div class="transition-content"></div><audio><source src=""></audio></div>');
		this.modal = $('#transition');
		this.modal.css({backgroundColor:this.options.bgColor})
		this.modal.find('.transition-bg').css({backgroundImage:'url('+this.options.bgImg+')',opacity:this.options.bgOpacity,backgroundSize:this.options.bgSize,backgroundPosition:this.options.bgPos})
		this.modal.find('.transition-content').css({color:this.options.fontColor,fontSize:this.options.fontSize}).html(this.options.content);
		if(this.options.audio){
			this.audio = this.modal.find('audio')[0];
			this.modal.find('audio').attr('src',this.options.audio);
			this.audio.load();
			this.audio.play();
		}

		this.modal.fadeIn(400,()=>{
			if(game.user.isGM && !this.preview && this.sceneID !==false)
				game.scenes.get(this.sceneID).activate();
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
		
		let time = (instant) ? 0:400;
		clearTimeout(this.timeout);
		this.modal.fadeOut(time,()=>{
			if(this.audio !== null)
				this.audio.pause();
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
}

class TransitionForm extends FormApplication {
 	constructor(object, options) {
        super(object, options);
        //console.log(object,options)
        this.transition = object || {}
        this.data = {};
        this.interval = null;
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
    /**
     * 
     */
    activateListeners(html) {
        super.activateListeners(html);
     	//this.updatePreview();
        const bgImageInput = html.find('input[name="bgImg"]');
        const bgOpacityInput = html.find('input[name="bgOpacity"]');
        const bgSizeInput = html.find('input[name="bgSize"]');
        const bgPosInput = html.find('input[name="bgPos"]');
        const fontSizeInput = html.find('input[name="fontSize"]')
        const textEditor = html.find('.mce-content-body');
        
        const preview = $('#transition');
         bgSizeInput.on('change', e =>{
       
            this.data.bgSize = e.target.value;
            preview.find('.transition-bg').css('background-size',this.data.bgSize)
        });
        bgPosInput.on('change', e =>{
            console.log('test')
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
        let editor = this.editors.content.mce;
;
        if(editor){
        	editor.on('focus',e=>{
        		this.interval = setInterval(function(){
        			preview.find('.transition-content').html(editor.getBody().innerHTML)
        		},500)
        	})
        	editor.on('blur', e=>{
        		clearInterval(this.interval);
        	})
        }
    }
   
        
    async _onSubmit(event, {updateData=null, preventClose=false, preventRender=false}={}) {
    	event.preventDefault();
    	if ( !this.rendered || !this.options.editable || this._submitting ) return false;
	    this._submitting = true;

	    // Acquire and validate Form Data
	    const form = this.element.find("form").first()[0];
	    const FD = this._getFormData(form);
	    const dtypes = FD._dtypes;

	    // Construct update data object by casting form data
	    let formData = Array.from(FD).reduce((obj, [k, v]) => {
	      let dt = dtypes[k];
	      if ( dt === "Number" ) obj[k] = v !== "" ? Number(v) : null;
	      else if ( dt === "Boolean" ) obj[k] = v === "true";
	      else if ( dt === "Radio" ) obj[k] = JSON.parse(v);
	      else obj[k] = v;
	      return obj;
	    }, {});

	    // Incorporate any additional provided updateData
	    if ( updateData && (typeof updateData === "object") ) {
	      formData = mergeObject(formData, updateData);
	    }

	    // Flag if the application is staged to close to prevent callback renders
	    if ( this.options.closeOnSubmit ) this._state = this.constructor.RENDER_STATES.CLOSING;
	    else if ( preventRender ) this._state = this.constructor.RENDER_STATES.RENDERING;

	    // Trigger the object update
	    try {
	      await this._updateObject(event, formData);
	    } catch(err) {
	      console.error(err);
	      preventClose = true;
	    }

	    // Restore flags and (optionally) close
	    this._submitting = false;
	    this._state = this.constructor.RENDER_STATES.RENDERED;
	 
	   this.transition.updateData(formData);
	  if(sceneID != false)
	       game.scenes.get(this.transition.sceneID).setFlag('scene-transitions','transition',this.transition)
	  
	   this.close();
	  

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
    /**
     * 
     */
    async _updateObject(event, formData) {
    	return true;
   	}
     
}
Hooks.on('init',() => {;
	console.log('Scene Transition')
	game.socket.on('module.scene-transitions', async (data) => {
        console.log(data.sceneID,data.options)
		new Transition(false,data.sceneID, data.options).render()
	})
    CONFIG.debug.hooks = true;
});
Hooks.on('closeTransitionForm', (form)=>{
	activeTransition.destroy(true);
	activeTransition = null;
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
        activeTransition = new Transition(false, false, options)
        activeTransition.render()
        let data = {sceneID:false,options:options}
        game.socket.emit('module.scene-transitions', data);

       
    });
})

//Credit to Winks' Everybody Look Here for the code to add menu option to Scene Nav
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
        	activeTransition = new Transition(false, sceneID, game.scenes.get(li.data(idField)).getFlag('scene-transitions','transition').options )
        	activeTransition.render()
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
           
          	activeTransition = new Transition(true,sceneID)
          	activeTransition.render()
          	transitionForm = new TransitionForm(activeTransition).render(true);
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
          	activeTransition = new Transition(true,li.data(idField),scene.getFlag('scene-transitions','transition').options)
          	activeTransition.render()
          	
          	transitionForm = new TransitionForm(activeTransition).render(true);
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
//Adds menu option to Scene Nav and Directory
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
Hooks.on("getJournalEntryContext", (html, contextOptions) => {
    console.log('test')
})
Hooks.on('getJournalDirectoryEntryContext', (html,contextOptions)=>{
    contextOptions.push(addPlayTransitionBtnJE('entityId'));
    console.log('test')
});
function addPlayTransitionBtnJE(idField) {
    return {
        name: "Play Transition From Journal",
        icon: '<i class="fas fa-play-circle"></i>',
        condition: li => {
            
            if(game.user.isGM)
                return true;
        },
        callback: li => {
            console.log(idField,li)
            let id = li.data(idField);
            console.log(id)
           let journal = game.journal.get(id).data;
            let options = {
                content:journal.content,
                bgImg:journal.img
            }
            activeTransition = new Transition(false, false, options)
            activeTransition.render()
            let data = {sceneID:false,options:options}
            game.socket.emit('module.scene-transitions', data);
            
        }
    };
}
Hooks.on('renderJournalSheet', (journal)=>{
    console.log(journal)
    if(game.user.isGM && $('#'+journal.id+' > header').find('.play-transition').length == 0){
         $('<a class="play-transition"><i class="fas fa-play-circle"></i> Play as Transition</a>').insertAfter('#'+journal.id+' > header > h4');
    }
})