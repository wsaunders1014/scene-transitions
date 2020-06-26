const stmod = 'scene-transitions';
let sceneID = null;
//Scene.prototype.transition = false;
//Object.defineProperty(Scene,'transition',{value:null})
class Transition {
	constructor(journalID,scene,options){
		console.log(scene)
		this.scene = scene;
		this.options = mergeObject(this.constructor.defaultOptions, options || {});
		console.log('transition', this.options)
		this.journal = game.journal.get(journalID).data;
		console.log(this.journal.img)
		this.modal = null;
		this.createIntro();

	}
	
	
	static get defaultOptions(){
		return{
			fontColor:'#ffffff',
			fontSize:'36px',
			backgroundImage:'',
			backgroundColor:'#000000',
			backgroundOpacity:1,
			delay:2000
		}
	}
	createIntro(){
		$('body').append('<div id="intro-modal"><div class="bg"></div><div class="content"></div></div>');
		this.modal = $('#intro-modal');
		//this.modal.html(this.getJournalText())
		this.modal.css({backgroundColor:this.options.backgroundColor,color:this.options.fontColor,fontSize:this.options.fontSize})
		if(this.journal.img)
			this.modal.find('.bg').css('background-image','url('+this.journal.img+')');
		this.modal.on('click',function(e){
			$(this).remove();
		});
		this.modal.fadeIn(400,()=>{
			if(game.user.isGM)
				this.scene.activate();
			this.modal.find('.content').html(this.getJournalText());
			this.modal.find('.content').fadeIn();
			setTimeout(()=>{
				this.modal.fadeOut(1000,()=>{
					this.modal.remove();
				})
			},this.options.delay)
			
		})
	}
	playSound(){

	}
	close(){

	}
	getJournalText(){
		return this.journal.content;
	}
	getJournalImg(){
		return this.journal.img;
	}
}

Hooks.on('init',() => {
	console.log('Scene Transition')
	CONFIG.debug.hooks = true;
	game.socket.on('module.scene-transitions', async (sceneID) => {
		 //console.log(scene.getFlag(stmod,'intro'))
		//console.log('socket test', scene)
		playIntro(sceneID)
	})
});
Hooks.on('renderSceneConfig',(config,html,settings)=>{
	sceneID = settings.entity._id;
	let entries = settings.journals;
	//INSERT INTRO SELECT
	$(`<div class="form-group"><label>Intro Journal</label><select id="intro-select" name="transition" data-dtype="String"><option value=""></option></select><p class="notes">A linked Journal Entry that provides content for the Scene Intro</p></div>`).insertAfter($(html).find('.form-group')[1]);

	 let selectedIntro = game.scenes.get(sceneID).getFlag(stmod,'intro');
	// console.log(game.scenes.get(sceneID).getFlag(mod,'intro'))
	
	//FILL OUT OPTIONS FROM JOURNALS
	entries.forEach((entry)=>{
		if(entry._id === selectedIntro)
			$('#intro-select').append(`<option value="${entry._id}" selected="true">${entry.name}</option>`)
		else
			$('#intro-select').append(`<option value="${entry._id}">${entry.name}</option>`)
	});

	// //SET scene.transition based on selection
	// $('#intro-select').on('change',(e)=>{
	// 	console.log('change',e)
	// 	//game.scenes.get(sceneID).unsetFlag('scene-transitions','intro')
	// 	//game.scenes.get(sceneID).setFlag('scene-transitions','intro',e.target.value)
	// 	//game.scenes.get(sceneID).data.transition = e.target.value;
	// })
	$('button[type=submit]').on('click',(e)=>{
		e.preventDefault();
		console.log($(html).find('form'))
		$('#intro-select').attr('disabled',true)
		game.scenes.get(sceneID).unsetFlag('scene-transitions','intro')
		game.scenes.get(sceneID).setFlag('scene-transitions','intro',$('#intro-select').val())

		$(html).find('form').submit()
	})
	$(html).find('form').on('submit',(e)=>{
		console.log('submit')
		e.preventDefault();e.stopPropagation();
	})
})
Hooks.on('ready',()=>{

})

//Credit to Winks' Everybody Look Here for the code to add menu option to Scene Nav
function getContextOption2(idField) {
	   
	
    return {
        name: "Transition",
        icon: '<i class="fas fa-play-circle"></i>',
        condition: li => {
        	if(game.user.isGM && game.scenes.get(li.data(idField)).getFlag('scene-transitions','intro'))
        		return true;
        },
        callback: li => {
            let scene = game.scenes.get(li.data(idField));   
           // playIntro(scene)
           console.log(scene.getFlag(stmod,'intro'))
           playIntro(li.data(idField))
           game.socket.emit('module.scene-transitions', li.data(idField));
        }
    };
}
//Adds menu option to Scene Nav and Directory
Hooks.on("getSceneNavigationContext", (html, contextOptions) => {
    contextOptions.push(getContextOption2('sceneId'));
});

Hooks.on("getSceneDirectoryEntryContext", (html, contextOptions) => {
    contextOptions.push(getContextOption2('entityId'));
});
var playIntro = (sceneID) =>{
	//let introData = game.journal.get(scene.getFlag(stmod,'intro'))
	//console.log(scene,introData)
	 let scene = game.scenes.get(sceneID);
	let intro = new Transition(scene.getFlag(stmod,'intro'),scene);
}