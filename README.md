# scene-transitions
Allows GM to make simple transitions to show players before navigating to new screen. Can be used for narrative effect. Can now be used with macros to create transitionless Transitions. And journal entries can now be used to generate a Transition.

Macro sample code:

```javascript
let data = {
	sceneID:false,
	options:{
		fontColor:'#ffffff',
		fontSize:'28px',
		bgImg:'', // pass any relative or absolute image url here.
		bgPos:'center center',
		bgSize:'cover',
		bgColor:'#333333',
		bgOpacity:0.7,
		delay:5000, //how long for transition to stay up
		skippable:true, //Allows players to skip transition with a click before delay runs out.
		content:"TEST MACRO"
	}
}

activeTransition = new Transition(false, data.sceneID, data.options) //
activeTransition.render()// These 2 lines can be omitted if you don't want to personally see the transition.
game.socket.emit('module.scene-transitions', data);
```
To play a transition without a scene activation, simple pass `false` as the sceneID in the data object.

# 0.0.7
0.7.5 Fix. Pull Request merge to fade out audio.

# 0.0.6
You can now create and send a transition to all players using a macro. There is now a 'Play as Transition' option on the context menu for Journal Entries and it's sheet header. This takes the content and image from the journal and makes a transition out of it with the default settings.

# 0.0.5
Background size and positioning is now configurable.

# 0.0.4
Fixed some bugs.

# 0.0.3
Hotfix: Socket emit transition did not have preview mode set.

# 0.0.2
Removed preview from form window and instead create live preview transition in the background.

# 0.0.1
Alpha Release
Click Create Transition on scene context menu. Add text, audio, and background image. Set length to show players and whether you want players to be able to close it.
