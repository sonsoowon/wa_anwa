const a = (async () => {
    const response = await axios.get('wa_anwa/time');
    return response
  })();

const checkbox = document.getElementById("submitbutton");


function showbettingmodal(region) {
    bettingmodal = document.getElementById("bettingmodal");
    bettingmodal.classList.add("show");
    document.getElementById("region-name").innerHTML = region
    document.getElementById("8amor6pm").innerHTML = a.data.hour
};

const bettingSubmit = async () => {
    region = document.getElementById("region-name").innerHTML
    const data = new FormData();
    data.append("region", region);
    data.append("time", a.data.hour);
    data.append("date", `${a.data.year}.${a.data.month}.${a.data.day}`);
    const response = await axios.post('wa_anwa/createparticipate');
    wa = document.getElementById("wa")
    document.getElementById(region).style.backgroundColor =  wa.checked ? "blue" : "black";
    bettingmodal = document.getElementById("bettingmodal");
    bettingmodal.classList.remove("show");
};

const Ablesubmit = () => {
    checkbox.disabled = false;
};

const Disablesubmit = () => {
    checkbox.disabled = true;
};

(()=>{    
    document.getElementById('inputdiv').addEventListener("change", function (e) {
        if (document.getElementById("pointselect").value > 0 && document.querySelector('input[name="selectwaanwa"]:checked') !== null) {
            Ablesubmit();
        }
        if (Number.isInteger(document.getElementById("pointselect").value)) {
            Disablesubmit();
        }
    })
    document.getElementById("submitbutton").addEventListener("click", bettingSubmit())
})();


