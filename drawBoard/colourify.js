// This one is for https://github.com/Leimi/drawingboard.js




// board.setColor("hsl(100,100%,50%)")
// Suppose around 10 minutes per page. In some cases with multiple examples, we can have also 20 minutes per page. 
// Take 20 mintues drawing time to come around.

// Timestamp is in milliseconds. 
const rtt = 1*60*1000; // round-trip time 20 minutes [ms]
var timeDrawn = 0; // how much time we have spent drawing
var lastDown;
var lastUp; 


function fractionate(total, target) {
    let f = total/target;
    //console.log("f", f)
    let colour = `hsl(${f * 300},100%,50%)`; // We don't want to come all the way around as this would create ambiguity
    //console.log(colour);
    return(colour);

}



var board; // The board on which we apply our timed pencil

function timedPencil(passedBoard) {
    board = passedBoard;
    board.ev.bind("board:startDrawing", penDown);
    board.ev.bind("board:stopDrawing", penUp);
    board.ev.bind("board:drawing", prog);


    board.setColor(fractionate(timeDrawn, rtt));

}

function penDown(e) {
    console.log("penDown", e);
    //board.setColor("#00ff00");

    lastDown = e.e.timeStamp;

    // We also want to shift the colour a bit after waiting between drawing
    if(lastUp) {
        console.log(lastDown-lastUp);
        timeDrawn += Math.min((lastDown - lastUp)/10, rtt/20); // Change it max a twentieth for easier progress tracking
    }
}

function penUp(e) {
    console.log("penUp", e);

    lastUp = e.e.timeStamp;
    timeDrawn += lastUp - lastDown;
    //console.log(timeDrawn);

    //board.setColor(fractionate(timeDrawn, rtt));
}

function prog(e) {
    //console.log("progress", e);
    board.setColor(fractionate((timeDrawn + e.e.timeStamp - lastDown), rtt));
    //console.log(timeDrawn);
}


var defaultBoard = new DrawingBoard.Board('zbeubeu');

timedPencil(defaultBoard);
