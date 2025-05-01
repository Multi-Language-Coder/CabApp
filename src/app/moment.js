const input = document.getElementById("Num");
const btn = document.getElementById("try");
const randomNum = Math.round(Math.random()*300)
let tries = 0;
const tryNum = () => {
    if(randomNum > parseInt(input.value)){
        alert("Guess higher")
        tries= tries+1;
    } else if(randomNum < parseInt(input.value)){
        alert("Guess Lower")
        tries=tries+1;
        
    } else if(randomNum == parseInt(input.value)){
        alert(`CORRECT
            Number Of Tries:${tries}`)
    }
}
btn.addEventListener("click",tryNum)