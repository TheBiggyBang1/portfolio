$('.portfolio-button').mousedown(function(){
    timeout = setInterval(function(){
        window.scrollBy(0,-1); 
    }, 0); 

    return false;
});
function makeCall() {
    var phoneNumber = document.getElementById('phone-number').innerText;
    phoneNumber = phoneNumber.replace(/\s/g, ''); 

    window.location.href = `tel:${phoneNumber}`;
}
