/************************
 * Scene Transitions
 * Origianl Author: @WillS
 * Maintained by @WillS and @DM_miX
*************************/



/**
 * The magic happens here
 * @param preview: 
 * @param sceneID: The scene to transition to
 * @param options: See default options below for a list of all available
 */

 class Transition {

    /**
     * 
     * @param {*} preview 
     * @param {*} options: v0.1.1 options go here. Previously sceneID
     * @param {*} optionsBackCompat: Previously used for options. Deprecated as of 0.1.1
     */
	constructor(preview, options, optionsBackCompat){
        //Allow for older versions
        if(optionsBackCompat) {
            optionsBackCompat.sceneID = options;
            options = optionsBackCompat;
        }

		this.preview = preview;
		this.options = {
            ...this.constructor.defaultOptions,
            ...options
        }
        this.sceneID = this.options.sceneID;
		this.journal = null;
		this.modal = null;
        this.destroying = false;
        if(Transition.hasNewAudioAPI) {
            this.playingAudio = new Sound()
        } else {
            this.audio = null;
        }
        
	}

    static activeTransition = new Transition;
	
	static get defaultOptions(){
		return{
            sceneID: false,
            hideGM: true,
			fontColor:'#777777',
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
            gmEndAll:true,
			content:""
		}
	}

    static get hasNewAudioAPI(){
        return typeof Howl != 'undefined' ? false : true;
    }

    /********************
     * Button functions for Foundry menus and window headers
     *******************/
    static addPlayTransitionBtn(idField) {
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
                let options = game.scenes.get(li.data(idField)).getFlag('scene-transitions','transition').options;
                options.sceneID = sceneID;
                let activeTransition = new Transition(false, options)
                activeTransition.render()
                game.socket.emit('module.scene-transitions', options);
                
            }
        };
    }


    static addCreateTransitionBtn(idField) {
        return {
            name: "Create Transition",
            icon: '<i class="fas fa-plus-square"></i>',
            condition: li => {
        
                if(game.user.isGM && !game.scenes.get(li.data(idField)).getFlag('scene-transitions','transition'))
                    return true;
            },
            callback: li => {
                let sceneID = li.data(idField);   
            
                let activeTransition = new Transition(true,{sceneID: sceneID})
                activeTransition.render()
                new TransitionForm(activeTransition).render(true);
            }
        };
    }


    static addEditTransitionBtn(idField) {
        return {
            name: "Edit Transition",
            icon: '<i class="fas fa-edit"></i>',
            condition: li => {
                
                if(game.user.isGM && game.scenes.get(li.data(idField)).getFlag('scene-transitions','transition'))
                    return true;
            },
            callback: li => {
                let scene = game.scenes.get(li.data(idField));   
                let activeTransition = new Transition(true ,scene.getFlag('scene-transitions','transition').options)
                activeTransition.render()
                new TransitionForm(activeTransition).render(true);
            }
        };
    }


    static addDeleteTransitionBtn(idField) {	
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


    static addPlayTransitionBtnJE(idField) {
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
                    sceneID: false,
                    content:journal.content,
                    bgImg:journal.img
                }
                let activeTransition = new Transition(false, options)
                activeTransition.render()
                game.socket.emit('module.scene-transitions', options);
            }
        };
    }

    static macro(options, showMe) {
        game.socket.emit('module.scene-transitions', options);

        if(showMe) {
            let activeTransition = new Transition(false, options)
            activeTransition.render()
        }
    }



    createFromJournal(journalID){
        //todo
    }






	render(){
        Transition.activeTransition = this;
        if(this.options.hideGM && this.options.fromSocket && game.user.isGM) {
            return;
        }

        if(Transition.hasNewAudioAPI) {
            $('body').append('<div id="transition" class="transition"><div class="transition-bg"></div><div class="transition-content"></div></div>');
        } else {
            $('body').append('<div id="transition" class="transition"><div class="transition-bg"></div><div class="transition-content"></div><audio><source src=""></audio></div>');

        }

		this.modal = $('#transition');
		this.modal.css({backgroundColor:this.options.bgColor})
		this.modal.find('.transition-bg').css({backgroundImage:'url('+this.options.bgImg+')',opacity:this.options.bgOpacity,backgroundSize:this.options.bgSize,backgroundPosition:this.options.bgPos})
		this.modal.find('.transition-content').css({color:this.options.fontColor,fontSize:this.options.fontSize}).html(this.options.content);
        
		if(this.options.audio){

            if(Transition.hasNewAudioAPI) {
                // 0.8.1+
                if(game.audio.locked) {
                    console.log ("Scene Transitions | Audio playback locked, cannot play " + this.options.audio)
                } else {
                    let thisTransition = this;
                    AudioHelper.play({src: this.options.audio, volume: this.options.volume, loop: false}, false).then( function(audio) {
                        audio.on('start', (a)=>{
                            
                        });
                        audio.on('stop', (a)=>{
                            
                        });
                        audio.on('end', (a)=>{
                            
                        });

                        thisTransition.playingAudio = audio; // a ref for fading later                
                    });
                }
            } else {
                // 0.7.9
                this.audio = this.modal.find('audio')[0];
                this.modal.find('audio').attr('src',this.options.audio);
                this.audio.load();
                this.audio.volume = this.options.volume.toFixed(1);
                this.audio.play();
            }
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
                if(this.options.gmEndAll && game.user.isGM) {
                    game.socket.emit('module.scene-transitions', {action: "end"});
                }
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
        if(this.destroying == true) return;

        this.destroying = true;
        let time = (instant) ? 0:this.options.fadeOut;
		clearTimeout(this.timeout);
        if(Transition.hasNewAudioAPI) {
		    if(this.playingAudio.playing) {this.fadeAudio(this.playingAudio, time);}
        } else {
            if(this.audio !== null) this.fadeAudio(this.audio, time);
            this.modal.fadeOut(time,()=>{
                this.modal.remove();
                this.modal = null;
            })
        }
		this.modal.fadeOut(time,()=>{
			this.modal.remove();
			this.modal = null;
		})
	}

	updateData(newData){
		this.options = mergeObject(this.options,newData);
		return this;
	}

	getJournalText(){
		return this.journal.content;
	}

	getJournalImg(){
		return this.journal.img;
	}

	fadeAudio(audio, time){

        if(Transition.hasNewAudioAPI) {
            // 0.8.1+
            if(!audio.playing) {
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
                if(volume.toFixed(6) <= targetVolume){
                    audio.stop();
                    clearInterval(audioFadeTimer);
                };
            }
            fade();
            let audioFadeTimer = setInterval(fade,50);

        } else {
            // 0.7.9
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
        };
	};




    
    static registerSettings() {
        game.settings.register("scene-transitions", "show-journal-header-transition", {
            name: "Show Play as Transition in Journal window",
            hint: "",
            scope: "world",
            config: true,
            type: Boolean,
            default: true
        });
    }

    static registerSockets() {
        game.socket.on('module.scene-transitions', async (data) => {
            if(data.action) {
                switch (data.action) {
                    case "end":
                        Transition.activeTransition.destroy();
                        break;
                
                    default:
                        break;
                }


            } else {
                
                // Run a transition
                let options = data;
                if (!options.users || options.users.contains(game.userId)) {
                    options = {
                        ...options,
                        fromSocket: true
                    }
                    new Transition(false, options).render();
                }
            }

        })

    }



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
            title: "Edit Transition",
            template: `modules/scene-transitions/templates/transition-form.html`,
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
            if(this.playingAudio.playing) {
            this.playingAudio.gain.value = e.target.value
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
        if(Transition.hasNewAudioAPI) {
            this.transition.playingAudio.stop();
        }
        super.close()
    }
   
        
    async _onSubmit(event, {updateData=null, preventClose=false, preventRender=false}={}) {
        
        const states = this.constructor.RENDER_STATES;
        if ( (this._state === states.NONE) || !this.options.editable || this._submitting ) return false;
        this._submitting = true;

        if(Transition.hasNewAudioAPI) {
            this.transition.playingAudio.stop();
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
	    if(this.transition.sceneID != false)
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
    Transition.registerSettings();
    Transition.registerSockets();   
});


Hooks.on('closeTransitionForm', (form)=>{
    let activeTransition = form.object;
    activeTransition.destroy(true)
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
        new Transition(false, options).render()
        game.socket.emit('module.scene-transitions', options);
    });
})










/********************
 * Adds menu option to Scene Nav and Directory
 *******************/
//Credit to Winks' Everybody Look Here for the code to add menu option to Scene Nav
Hooks.on("getSceneNavigationContext", (html, contextOptions) => {
    contextOptions.push(Transition.addPlayTransitionBtn('sceneId'));
    contextOptions.push(Transition.addCreateTransitionBtn('sceneId'));
    contextOptions.push(Transition.addEditTransitionBtn('sceneId'));
    contextOptions.push(Transition.addDeleteTransitionBtn('sceneId'));
});

Hooks.on("getSceneDirectoryEntryContext", (html, contextOptions) => {
    contextOptions.push(Transition.addPlayTransitionBtn('entityId'));
    contextOptions.push(Transition.addCreateTransitionBtn('entityId'));
    contextOptions.push(Transition.addEditTransitionBtn('entityId'));
    contextOptions.push(Transition.addDeleteTransitionBtn('entityId'));
});

Hooks.on('getJournalDirectoryEntryContext', (html,contextOptions)=>{
    contextOptions.push(Transition.addPlayTransitionBtnJE('entityId'));
});

Hooks.on('renderJournalSheet', (journal)=>{
    if(game.user.isGM && $('#'+journal.id+' > header').find('.play-transition').length == 0 && game.settings.get("scene-transitions", "show-journal-header-transition") == true) {
         $('<a class="play-transition"><i class="fas fa-play-circle"></i> Play as Transition</a>').insertAfter('#'+journal.id+' > header > h4');
    }
})






