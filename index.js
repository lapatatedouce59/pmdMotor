let currentSpeed = 0;
let currentThrottle = 0;
let throttleDisplay = document.querySelector("#throttle-status");
let rangeInput = document.querySelector("#throttle");
let speedDisplay = document.querySelector("#speed");
let delta = 1;
let lastUpdate = Date.now();
let max_tps = 50.0;
const maxSpeed = 80;


up()

function up(){
    update();
    requestAnimationFrame(up);
}

function update(){
    console.log(currentThrottle)
    let rn = Date.now();
    let inter = rn - lastUpdate;
    let theorical_inter = 1000.0 / max_tps;
    delta = inter / theorical_inter;
    lastUpdate = rn;
    if(delta>5)delta=5;
    if(delta<=0)return;

    currentThrottle = parseInt(rangeInput.value);
    currentSpeed += ((currentThrottle / 50) * delta);
    
    if(currentSpeed > maxSpeed) currentSpeed = maxSpeed;
    if(currentSpeed < 0) currentSpeed = 0;
    speedDisplay.innerHTML = currentSpeed.toFixed(2);
    if(currentThrottle === -6){
        throttleDisplay.innerHTML = "FU";
    } else {
        throttleDisplay.innerHTML = currentThrottle;
    }
    

    /*const activation_treshold = 12;
    if(STATES[0] !== STATES[1]) {
        if(currentThrottle>0)currentSpeed = activation_treshold+.01;
        else currentSpeed = activation_treshold-.01;
    }*/
}