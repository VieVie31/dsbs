/**
 *	Automaton script for FINITE STATE MACHINE
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 1996):
 * <orissermaroix@gmail.com> wrote this file. You want with this stuff. 
 * If we meet some day, and you think this stuff is worth it, 
 * you can buy me a beer in return. Olivier RISSER-MAROIX
 * ----------------------------------------------------------------------------
 */

function State(name, is_initial=false, is_final=false) {
	//set an 'unique' name to the state
	this.name = name;

	//make it initial and/or final if needed
	this.is_initial = is_initial;
	this.is_final = is_final;

	//initializing the transition array
	this.transition = [];

	this.add_transition = function(char, state) {
		if (char in this.transition)
			this.transition[char].push(state);
		else
			this.transition[char] = [state];
	}

	this.is_deterministic = function() {
		for (k in this.transition)
			if (this.transition[k].length > 1)
				return false;
		
		return true;
	}
}

function FSM() {
	this.states = arguments;
	this.last_lecture = [];
	this.initial_state = null;

	var c = 0;
	for (var i = 0; i < this.states.length; i++) {
		//check if all states are deterministic
		if (!this.states[i].is_deterministic())
			throw "A non determinist state has been added... :'(";

		//set initial state and check there is not more than 1
		if (this.states[i].is_initial) {
			++ c;
			this.initial_state = this.states[i];

			if (c > 1)
				throw "To many initial states... :'(";
		}
	}

	if (c != 1)
		throw "No initial state... :'("

	this.read = function(word) {
		//split the word by comma beacause eeach 'character' of the word is comma separated...
		var word = word.split(',');

		//remove empty strings !! (no 'epsilon transition')
		word = word.filter(function(v)  {
			return v != ""; 
		});

		//reset the last lecture...
		this.__last_lecture = [];

		var current = this.initial_state;
		for (var i = 0; i < word.length; i++) {
			var c = word[i];

			if (c in current.transition) {
				this.__last_lecture.push(current);
				current = current.transition[c][0];
			} else {
				var error_message = "No transition for this char : " + c + " !! :'(";
				this.__last_lecture.push(error_message);
				throw error_message;
			}
		}

		//check if the last state is a valid final state
		if (!current.is_final) {
			var error_message = "Last state is not a valid final state !! :'(";
			this.__last_lecture.push(error_message);
			throw error_message;
		}

		this.__last_lecture.push(current);
		this.__last_lecture.push("Word : " + word + " successfully readed  !! :D");

		return this.__last_lecture.slice();
	}
}

function GState(name, is_initial=false, is_final=false) {
	//manage the 'graphical' State
	this.state = new State(name, is_initial, is_final);

	//create the state on the html page...
	$("body").append("<div id='" + name + "' class='state " + (is_initial ? "initial" : '') + " " + (is_final ? "final" : '') + "' style='position:absolute;top:50%;left:50%;'><span>" + name + "</span><div class='loop' style='display:none;'>&#8634;<sup></sup></div></div>");

	//refresh the draggable rule : all states are draggable... and the lines should change at the same time
	$(".state").draggable({cursor: 'move'});

	this.add_transition = function (char, gstate) {
		if (gstate.state == this.state) {
			//add a loop
			var loop_div = $("#" + this.state.name).children()[1];
			//add the letter
			loop_div.children[0].innerText += (loop_div.children[0].innerText.length > 0 ? ',' : '') + char;

			//display the loop if not allready set visible
			loop_div.style["display"] = "block";

		} else { //FIXME ???
			//TODO : add a transition
			var text = "";
			try {
				var arrow = $("[from='" + this.state.name + "'][to='" + gstate.state.name + "']");
				text = arrow.children().text();//arrow[0].children[0].innerText;
			} catch (e) {}

			try { //try to not duplicate arrows : update
				text += (text.length > 0 ? ',' : '') + char;

				update_arrow_pos(this.state.name, gstate.state.name, text);
			} catch (e) { //create
				//no link was created before with this from and to attribute...
				connect(this.state.name, gstate.state.name, "gray", 3, char); //create it...
			}
			
		}

		this.state.add_transition(char, gstate.state);
	}
}

function GFSM() {
	this.gstates = arguments;

	var m = [null];
	for (var i = 0; i < this.gstates.length; i++)
		m.push(this.gstates[i].state);

	this.fsm = new (Function.prototype.bind.apply(FSM, m));
	

	this.update_arrows = function() {
		$(".arrow").each(function() { 
			update_arrow_pos($(this).attr("from"), $(this).attr("to"));
		});

		//FIXME : make all text not rotated
		$(".arrow").each(function () { 
			var transform = ["-webkit-transform", "-moz-transform", "-ms-transform", "-o-transform", "transform"];

			for (var i = 0; i < transform.length; i++)
				$(this).children()[0].style[transform[i]] = "none";

			//$(this).children()[0].style["color"] = "green";
			$(this).children()[0].style["transform-origin"] = "initial";
			$(this).children()[0].style["transition"] = "0";
		});
	}

	this.read = function(word, speed=1000) { 
		//the word should have his all char separated by a comma...
		//speed is to control the animation (in millis), after eac quantum of "speed" a state change...

		//get the lecture states of the word
		try {
			this.fsm.read(word);
		} catch (e) {}

		var lecture = this.fsm.__last_lecture.slice();

		for (var i = 0; i < lecture.length; i++) {
			var current = lecture[i];

			if (current instanceof State) {
				(function (name) { //horrible hack because setTimeout is evil with variables !!! :p
					setTimeout(
						function() {
							//change the current state...
							$(".current").removeClass("current", {duration: speed / 3}); //remove the previous with a fadeout effect
							$("#" + name).addClass("current", {duration: speed / 3}); //set the current with a fadein effect
						},
						i * speed
					);
				})(current.name);
			} else {
				(function (text) { //f***ing time out !!!!!
					setTimeout(
						function() {
							alert(text); //display the error messate
						},
						i * speed
					);
				})(current);
			}
		}

		//display the last state...

	}
}

function compute_line_params(div1, div2, thickness=3) {
	var off1 = getOffset(div1);
    var off2 = getOffset(div2);
    // bottom right
    var x1 = off1.left + off1.width - 29; //bouuu hard codded variables are evil !!! ;) :p
    var y1 = off1.top + off1.height + 1;
    // top right
    var x2 = off2.left + off2.width - 30; //bouuu hard codded variables are evil !!! ;) :p
    var y2 = off2.top + 58; //bouuu hard codded variables are evil !!! ;) :p
    // distance
    var length = Math.sqrt(((x2-x1) * (x2-x1)) + ((y2-y1) * (y2-y1)));
    // center
    var cx = ((x1 + x2) / 2) - (length / 2);
    var cy = ((y1 + y2) / 2) - (thickness / 2) - 30; //bouuu hard codded variables are evil !!! ;) :p
    // angle
    var angle = Math.atan2((y1-y2),(x1-x2))*(180/Math.PI);

	return [cx, cy, length, angle];
}


function connect(from, to, color, thickness, text) {

	var div1 = $("#" + to)[0];
	var div2 = $("#" + from)[0];

	var p = compute_line_params(div1, div2);
	var cx = p[0];
	var cy = p[1];
	var length = p[2];
	var angle = p[3];
    
    //TODO: make text NOT rotated for lizibility !!!
    var htmlLine = "<div class='arrow' from='" + from + "' to='" + to + "' style='padding:0px; margin:0px; height:" + thickness + "px; background-color:" + color + "; line-height:1px; position:absolute; left:" + cx + "px; top:" + cy + "px; width:" + length + "px; -moz-transform:rotate(" + angle + "deg); -webkit-transform:rotate(" + angle + "deg); -o-transform:rotate(" + angle + "deg); -ms-transform:rotate(" + angle + "deg); transform:rotate(" + angle + "deg); text-align:center;'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#8594;<sub>" + text + "</sub></div>";

    document.body.innerHTML += htmlLine; 

    $(".state").draggable()
}

function getOffset(el) {
    var rect = el.getBoundingClientRect();
    return {
        left: rect.left + window.pageXOffset,
        top: rect.top + window.pageYOffset,
        width: rect.width || el.offsetWidth,
        height: rect.height || el.offsetHeight
    };
}

function update_arrow_pos(from, to, text="") { 
	var arrow = $("[from='" + from + "'][to='" + to + "']");

	//auto complete params...
	var text = (text == "" ? arrow.children().text() : text); //arrow[0].children[0].innerText;
	var thickness = parseInt(arrow[0].style["height"].substr(0, arrow[0].style["height"].length - 2));
	var color = arrow[0].style["background-color"];

	arrow.remove();

	connect(from, to, color, thickness, text);
}


