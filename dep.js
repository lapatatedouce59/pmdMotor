const STATES = [false, false, false, false]; // small hiiii (mf01); douhouuuhouuu (mp05 caracteristic activation); rahhhhh (constant sound); grincements
    let currentSpeed = 0;
    let currentThrottle = 0;
    let accelerationDisplay = document.querySelector("#acceleration");
    let rangeInput = document.querySelector("#throttle");
    let speedDisplay = document.querySelector("#speed");
    let delta = 1;
    let lastUpdate = Date.now();
    let max_tps = 50.0;
    const maxSpeed = 80;
    function up(){
        update();
        requestAnimationFrame(up);
    }
    function update(){
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
        accelerationDisplay.innerHTML = currentThrottle;

        const activation_treshold = 12;
        if(STATES[0] !== STATES[1]) {
            if(currentThrottle>0)currentSpeed = activation_treshold+.01;
            else currentSpeed = activation_treshold-.01;
        }

        // play sounds
        if(currentSpeed > 0 && currentSpeed < activation_treshold ){
            let vol = Math.min(currentSpeed, activation_treshold) / activation_treshold;
            SOUND_MANAGER.loopSound('p0', Math.max(vol, 0), 1 + Math.min(0.1, (0.1 * (currentSpeed / activation_treshold))));
        }else{
            SOUND_MANAGER.stopSound('p0');
        }
        if(currentSpeed>activation_treshold && !STATES[1]){
            SOUND_MANAGER.stopSound('p1');
            SOUND_MANAGER.playSound('p1',1,1,()=>{
                STATES[0]=true;});
            STATES[1]=true;
        }
        if(currentSpeed<=activation_treshold && STATES[1]){
            SOUND_MANAGER.stopSound('p1');
            SOUND_MANAGER.playSound('p1',1,-1,()=>{
                STATES[0]=false;
            });
            STATES[1]=false;
        }
        if(currentSpeed>activation_treshold && STATES[0]){
            let motor_level_speed = (currentSpeed-activation_treshold);
            let max_margin = maxSpeed -  activation_treshold;
            let speed_of_max = (motor_level_speed / max_margin);
            let starter = Math.min(motor_level_speed/(activation_treshold/2),1);
            SOUND_MANAGER.loopSound('p2', 1, 0.9 + Math.min(0.6, (0.6 * speed_of_max)));
        }else{
            SOUND_MANAGER.stopSound('p2');
        }
        if(!STATES[0] && currentSpeed < activation_treshold && currentThrottle<0 && currentSpeed>0){
            SOUND_MANAGER.loopSound('p3', (-currentThrottle) / 13, ((-currentThrottle) / 13)*0.1+1);
        }else{
            SOUND_MANAGER.stopSound('p3');
        }
    }