function makeCall() {
    var phoneNumber = document.getElementById('phone-number').innerText;
    phoneNumber = phoneNumber.replace(/\s/g, ''); 

    window.location.href = `tel:${phoneNumber}`;
}
document.getElementById("contactForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent default form submission

    // Get form values
    var nom = document.getElementById("nom").value;
    var email = document.getElementById("email").value;
    var country = document.getElementById("country").value;
    var message = document.getElementById("message").value;

    // Regular expression to check if the name contains only letters and spaces
    var nameRegex = /^[a-zA-Z\s]+$/;

    // Regular expression to check if the email format is valid
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check if name contains only letters and spaces
    var isNameValid = nameRegex.test(nom);

    // Check if email format is valid
    var isEmailValid = emailRegex.test(email);

    if (!isNameValid) {
        alert("Name not valid (conatins symbols or numbers).");
        return; // Stop form submission if the name is invalid
    }

    if (!isEmailValid) {
        alert("Email adress not valid.");
        return; // Stop form submission if the email is invalid
    }

    var formData = {
        nom: nom,
        email: email,
        country: country,
        message: message
    };

    console.log("Form Data:", formData);
    document.getElementById("messageSent").innerHTML = "Message sent successfully";
    document.getElementById("messageSent").style.display = "block";

});

