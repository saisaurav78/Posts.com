//Default for all pages-----------------------------------------------------------------------------------
if(window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href)
}
// const navbar = document.querySelector('.navbar')
// window.addEventListener('scroll', () => {
//     if ((navbar.getBoundingClientRect()).bottom < 0) {
//         navbar.style.position = 'sticky';
//         navbar.style.top = '0';
//     }
//     else {
//         navbar.style.position = 'relative';  // Or the original position
//     }
    
// })
// //------------------------------------------------------------------------------------------

//navbar script----------------------------------------------------------------------------
const navitem = document.querySelectorAll(".nav-item")
navitem.forEach(item => {
    if (item.querySelector("a").href === window.location.href) {
        item.classList.add('active')
        console.log(item.querySelector("a").href, window.location.href)
    }
    else {
        item.classList.remove('active')
    }
})

const dropdown = document.querySelector(".dropdown")
if (dropdown) {
    dropdown.addEventListener("mouseenter", () => {
        dropdown.classList.add("dropdownactive")
    })
    dropdown.addEventListener("mouseleave", () => {
        dropdown.classList.remove("dropdownactive")
    })
}
//-------------------------------------------------------------------------------------------


//Dashboard page script----------------------------------------------------------------------
const msg = document.getElementById("msg");
function checkPasswords(event) {
    const newpass = document.getElementById("newpass").value;
    const confirmpass = document.getElementById("cnfmpass").value;

    if (newpass !== confirmpass || newpass === null) {
        event.preventDefault();
        msg.style.display = "block";
        msg.innerText = "New password and confirm password do not match";
    }
}

//-------------------------------------------------------------------------------------------

//Login page script--------------------------------------------------------------------------
// 

//-------------------------------------------------------------------------------------------
//Registration page script-------------------------------------------------------------------
function checkPasswords(event) {
    const pass = document.getElementById("password").value;
    const confirmpass = document.getElementById("confirmpass").value;
    const msg = document.getElementById("msg");

    if (pass !== confirmpass || pass === null) {
        event.preventDefault();
        msg.style.display = "block";
        msg.innerText = "password and confirm password do not match";
    } else {
        msg.style.display = "none";
    }
}
function RemoveValidation() {
    const element = document.getElementById("validation-check")
    if (element) {
        element.remove()
    }
    const msg = document.getElementById("msg")
    if (msg) {
        msg.style.display = 'none'
    }
}
//-------------------------------------------------------------------------------------------
