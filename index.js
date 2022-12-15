const SOUND_MANAGER = {
    context: false,
    sounds: {},
    audios: {},
    soundscustomvolume: {},
    soundsdelta: {},
    globalVolume: 1,
    copySound: function (originId, ...targetIds) {
        let originSound = this.sounds[originId];
        if (!originSound) {
            console.log("Attempted to copy " + originId + ", but no sound is linked !");
            return false;
        }
        for (let target of targetIds) {
            this.sounds[target] = originSound;
            console.log('Copied ' + originId + " to " + target + " !");
        }
        return true;
    },
    registerSound: function (id, url, customVolume = false) {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.responseType = 'arraybuffer';
        let refThis = this;
        xhr.onload = function () {
            refThis.context.decodeAudioData(xhr.response, function (buffer) {
                if (typeof id === "string") {
                    id = [id];
                }
                for (let tid of id) {
                    refThis.sounds[tid] = buffer;
                    refThis.audios[tid] = [];
                    if (customVolume) {
                        refThis.soundscustomvolume[tid] = customVolume;
                    }
                }
                console.log("Registered sound " + id + " !");
            }, err => {
                console.error('Unable to register ' + id + '(' + url + '): ', err);
            });
        };
        xhr.send();
    },
    playSound: function (id, vol = 1, pitch = 1, onend = false, onnearend = false, prespitch=false) { // Returns true if no sound is linked, meaning should retry later
        let snd = this.sounds[id];
        if (!snd) {
            console.error("Attempted to play " + id + ", but no sound is linked !");
            return false;
        }
        let src = this.context.createBufferSource();
        src.buffer = snd;
        // src.playbackRate.value = pitch;
        this.setPitch(id, src, pitch,prespitch);

        // src.connect(this.context.destination);

        let gainNode = this.context.createGain();
        src.connect(gainNode);
        src.gainNode = gainNode;
        gainNode.connect(this.context.destination);
        let cstm = this.soundscustomvolume[id] ? this.soundscustomvolume[id] : 1;
        gainNode.gain.value = this.globalVolume * vol * cstm;
        // console.log('Gain: '+gainNode.gain.value);


        let rthis = this;
        src.onended = () => {
            if (onend && typeof onend == "function") onend();
            let c = 0;
            for (let ad of rthis.audios[id]) {
                if (ad === src) {
                    rthis.audios[id].splice(c, 1);
                }
                c++;
            }
        }
        src.ontimeupdate = () => {
            if (src.currentTime > (src.buffer.duration - .5)) {
                if (onnearend) onnearend();
            }
        }
        src.start(0);
        this.audios[id].push(src);
        return src;
    },
    /**
     * Stops every sound playing on given id, and avoid playing the onend
     * @param id registered ID of the sound
     */
    stopSound: function (id) {
        for (let idd in this.audios) {
            if (idd === id) {
                while (this.audios[id].length > 0) {
                    let a = this.audios[id].shift();
                    a.onended = () => {
                    };
                    a.stop();
                }
            }
        }
    },
    /**
     * Stops every sound playing on given id, but plays the onend
     * @param id registered ID of the sound
     */
    endSound: function (id) {
        for (let idd in this.audios) {
            if (idd === id) {
                while (this.audios[id].length > 0) {
                    let a = this.audios[id].shift();
                    a.stop();
                }
            }
        }
    },
    getPlayingSounds: function (id) {
        for (let idd in this.audios) {
            if (idd === id) {
                return this.audios[idd];
            }
        }
        return false;
    },
    isRegistered: function (id) {
        for (let idd in this.sounds) {
            if (idd === id) {
                return true;
            }
        }
        return false;
    },
    playBlob: async function (blob, volumeImmune = true) {
        let src = this.context.createBufferSource();
        src.buffer = await blob.arrayBuffer();

        let gainNode = this.context.createGain();
        src.connect(gainNode);
        src.gainNode = gainNode;
        gainNode.connect(this.context.destination);
        if (volumeImmune) gainNode.gain.value = this.globalVolume;

        src.start(0);
        return src;
    },
    loopSound: function(id, vol = 1, pitch = 1, prespitch = false){
        if(this.getPlayingSounds(id) && this.getPlayingSounds(id).length >= 1) {
            for(let sound of this.getPlayingSounds(id)){
                sound.gainNode.gain.value = vol;
                this.setPitch(id, sound, pitch, prespitch);
            }
            return;
        }
        let b = ()=>{
            this.playSound(id,vol,pitch,b);
        }
        b();
    },
    setPitch: (name, source, value, preserve=false) =>{
        if((value <0 && !SOUND_MANAGER.soundsdelta[name]) || (value >=0 && !!SOUND_MANAGER.soundsdelta[name])){
            let a = source.buffer;
            Array.prototype.reverse.call( a.getChannelData(0) );
            if(value < 0){
                SOUND_MANAGER.soundsdelta[name]=true;
            }else{
                SOUND_MANAGER.soundsdelta[name]=false;
            }
        }
        source.preservesPitch = true;
        // source.detune = 800;
        source.playbackRate.value = Math.abs(value);
    }
}
window.AudioContext = window.AudioContext || window.webkitAudioContext;
SOUND_MANAGER.context = new AudioContext();



(()=>{

    SOUND_MANAGER.registerSound("defu", 'sounds/fu/de-fu.mp3');
    SOUND_MANAGER.registerSound("fu", 'sounds/fu/fu-propre.mp3');
    SOUND_MANAGER.registerSound("fu80", 'sounds/fu/80kmh-fu.mp3');
    SOUND_MANAGER.registerSound("fu70", 'sounds/fu/fu-70kmh.mp3');
    SOUND_MANAGER.registerSound("fu60", 'sounds/fu/fu-60kmh.mp3');
    SOUND_MANAGER.registerSound("fu50", 'sounds/fu/fu-50kmh.mp3');
    SOUND_MANAGER.registerSound("fu30", 'sounds/fu/fu-30kmh.mp3');
    SOUND_MANAGER.registerSound("fu20", 'sounds/fu/fu-20kmh.mp3');
    SOUND_MANAGER.registerSound("fu3", 'sounds/fu/fu3.mp3');

    SOUND_MANAGER.registerSound("accel", 'sounds/accels-deccels/accel-0-80.mp3')

    SOUND_MANAGER.registerSound("5kmh", 'sounds/steady/3kmh.mp3')
    SOUND_MANAGER.registerSound("10kmh", 'sounds/steady/10kmh.mp3')
    SOUND_MANAGER.registerSound("15kmh", 'sounds/steady/15kmh.mp3')
    SOUND_MANAGER.registerSound("20kmh", 'sounds/steady/20kmh-steady.mp3')
    SOUND_MANAGER.registerSound("30kmh", 'sounds/steady/30kmh-steady.mp3')
    SOUND_MANAGER.registerSound("40kmh", 'sounds/steady/40kmh-steady.mp3')
    SOUND_MANAGER.registerSound("45kmh", 'sounds/steady/45kmh-steady.mp3')
    SOUND_MANAGER.registerSound("50kmh", 'sounds/steady/50kmh-steady.mp3')
    SOUND_MANAGER.registerSound("55kmh", 'sounds/steady/55kmh-steady.mp3')
    SOUND_MANAGER.registerSound("60kmh", 'sounds/steady/60kmh-steady.mp3')
    SOUND_MANAGER.registerSound("70kmh", 'sounds/steady/70kmh-steady.mp3')
    SOUND_MANAGER.registerSound("80kmh", 'sounds/steady/80kmh-steady.mp3')
    requestAnimationFrame(up);
})();


const STATES = [false, false, false, false] //DEFU ; FU
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

    const activation_treshold = 30;
    /*if(STATES[0] !== STATES[1]) {
        if(currentThrottle>0)currentSpeed = activation_treshold+.01;
        else currentSpeed = activation_treshold-.01;
    }*/



    if(currentThrottle === -6){
        throttleDisplay.innerHTML = "FU";
        currentSpeed += ((currentThrottle / 25) * delta);
        if(currentSpeed > maxSpeed) currentSpeed = maxSpeed;
        if(currentSpeed < 0) currentSpeed = 0;
        speedDisplay.innerHTML = currentSpeed.toFixed(1);
    } else {
        throttleDisplay.innerHTML = currentThrottle;
        currentSpeed += ((currentThrottle / 50) * delta);
        if(currentSpeed > maxSpeed) currentSpeed = maxSpeed;
        if(currentSpeed < 0) currentSpeed = 0;
        speedDisplay.innerHTML = currentSpeed.toFixed(1);
    }


    //SOUND HANDLING

    //DEFU
    if(currentSpeed > 0 && currentThrottle > 0 && currentSpeed < 1 && !STATES[0]){
        STATES[0]=true
        STATES[1]=false
        STATES[2]=false
        SOUND_MANAGER.playSound('defu');
        SOUND_MANAGER.stopSound('fu');
    }
    //FU
    if(currentSpeed <= 0 && !STATES[1] && STATES[0] && currentThrottle < 0){
        STATES[1]=true
        STATES[0]=false
        SOUND_MANAGER.playSound('fu');
        SOUND_MANAGER.stopSound('defu');
    }



    //STEADY
    if(currentSpeed >0 && currentSpeed <=7 && currentThrottle===0){
        SOUND_MANAGER.loopSound('5kmh')
    } else {
        SOUND_MANAGER.stopSound('5kmh')
    }

    if(currentSpeed >7 && currentSpeed <=12 && currentThrottle===0){
        SOUND_MANAGER.loopSound('10kmh')
    } else {
        SOUND_MANAGER.stopSound('10kmh')
    }

    if(currentSpeed >12 && currentSpeed <=17 && currentThrottle===0){
        SOUND_MANAGER.loopSound('15kmh')
    } else {
        SOUND_MANAGER.stopSound('15kmh')
    }

    if(currentSpeed >17 && currentSpeed <=25 && currentThrottle===0){
        SOUND_MANAGER.loopSound('20kmh')
    } else {
        SOUND_MANAGER.stopSound('20kmh')
    }

    if(currentSpeed >25 && currentSpeed <=35 && currentThrottle===0){
        SOUND_MANAGER.loopSound('30kmh')
    } else {
        SOUND_MANAGER.stopSound('30kmh')
    }

    if(currentSpeed >35 && currentSpeed <=42 && currentThrottle===0){
        SOUND_MANAGER.loopSound('40kmh')
    } else {
        SOUND_MANAGER.stopSound('40kmh')
    }

    if(currentSpeed >42 && currentSpeed <=47 && currentThrottle===0){
        SOUND_MANAGER.loopSound('45kmh')
    } else {
        SOUND_MANAGER.stopSound('45kmh')
    }

    if(currentSpeed >47 && currentSpeed <=52 && currentThrottle===0){
        SOUND_MANAGER.loopSound('50kmh')
    } else {
        SOUND_MANAGER.stopSound('50kmh')
    }

    if(currentSpeed >52 && currentSpeed <=57 && currentThrottle===0){
        SOUND_MANAGER.loopSound('55kmh')
    } else {
        SOUND_MANAGER.stopSound('55kmh')
    }

    if(currentSpeed >57 && currentSpeed <=68 && currentThrottle===0){
        SOUND_MANAGER.loopSound('60kmh')
    } else {
        SOUND_MANAGER.stopSound('60kmh')
    }

    if(currentSpeed >68 && currentSpeed <=78 && currentThrottle===0){
        SOUND_MANAGER.loopSound('70kmh')
    } else {
        SOUND_MANAGER.stopSound('70kmh')
    }

    if(currentSpeed >78 && currentThrottle===0){
        SOUND_MANAGER.loopSound('80kmh')
    } else {
        SOUND_MANAGER.stopSound('80kmh')
    }

    //FU
    if(currentSpeed >=78 && currentThrottle===-6 && !STATES[1]){
        SOUND_MANAGER.playSound('fu80')
        console.log("iteration")
        STATES[1]=true
        STATES[0]=false
        //console.log(STATES)
    } else
    if(currentSpeed <78 && currentSpeed >=68 && currentThrottle===-6 && !STATES[1]){
        SOUND_MANAGER.playSound('fu70')
        console.log("iteration")
        STATES[1]=true
        STATES[0]=false
        //console.log(STATES)
    } else
    if(currentSpeed <68 && currentSpeed >=58 && currentThrottle===-6 && !STATES[1]){
        SOUND_MANAGER.playSound('fu60')
        console.log("iteration")
        STATES[1]=true
        STATES[0]=false
        //console.log(STATES)
    } else
    if(currentSpeed <58 && currentSpeed >=42 && currentThrottle===-6 && !STATES[1]){
        SOUND_MANAGER.playSound('fu50')
        console.log("iteration")
        STATES[1]=true
        STATES[0]=false
        //console.log(STATES)
    } else
    if(currentSpeed <42 && currentSpeed >=28 && currentThrottle===-6 && !STATES[1]){
        SOUND_MANAGER.playSound('fu30')
        console.log("iteration")
        STATES[1]=true
        STATES[0]=false
        //console.log(STATES)
    } else
    if(currentSpeed <28 && currentSpeed >=10 && currentThrottle===-6 && !STATES[1]){
        SOUND_MANAGER.playSound('fu20')
        console.log("iteration")
        STATES[1]=true
        STATES[0]=false
        //console.log(STATES)
    } else
    if(currentSpeed <10 && currentThrottle===-6 && !STATES[1]){
        SOUND_MANAGER.playSound('fu3')
        console.log("iteration")
        STATES[1]=true
        STATES[0]=false
        //console.log(STATES)
    }
    

    /*const activation_treshold = 12;
    if(STATES[0] !== STATES[1]) {
        if(currentThrottle>0)currentSpeed = activation_treshold+.01;
        else currentSpeed = activation_treshold-.01;
    }*/
}


//SMAPI

