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
    /*let pre = 'assets/sounds/mp05/synth/';
    SOUND_MANAGER.registerSound("p0", pre+'frottements.mp3');
    SOUND_MANAGER.registerSound("p1", pre+'demarrage.mp3');
    SOUND_MANAGER.registerSound("p2", pre+'moteur.mp3');
    SOUND_MANAGER.registerSound("p3", pre+'grincements.mp3');*/
    SOUND_MANAGER.registerSound("defu", 'sounds/fu/de-fu.mp3');
    SOUND_MANAGER.registerSound("fu", 'sounds/fu/fu-propre.mp3');
    SOUND_MANAGER.registerSound("accel", 'sounds/accels-deccels/accel-0-80.mp3')
    requestAnimationFrame(up);
})();


const STATES = [false, false, false, false] //FU ; DEFU
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
        currentSpeed += ((currentThrottle / 20) * delta);
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
    if(currentSpeed > 0 && !STATES[0]){
        STATES[0]=true
        STATES[1]=false
        SOUND_MANAGER.playSound('defu');
        SOUND_MANAGER.stopSound('fu');
    }
    if(currentSpeed <= 0 && !STATES[1]){
        STATES[1]=true
        STATES[0]=false
        SOUND_MANAGER.playSound('fu');
        SOUND_MANAGER.stopSound('defu');
    }

    

    /*const activation_treshold = 12;
    if(STATES[0] !== STATES[1]) {
        if(currentThrottle>0)currentSpeed = activation_treshold+.01;
        else currentSpeed = activation_treshold-.01;
    }*/
}


//SMAPI

