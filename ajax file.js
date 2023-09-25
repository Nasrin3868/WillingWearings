// $(document).ready(function () {
//     // Handle form submission
//     $('#signup-form').submit(function (e) {
//         e.preventDefault(); // Prevent the default form submission

//         // Serialize form data
//         const formData = $(this).serialize();

//         // Send a POST request to the server
//         $.ajax({
//             type: 'POST',
//             url: '/dosignup', // Update the URL to match your server route
//             data: formData,
//             success: function (response) {
//                 // Check the response for errors and update the UI accordingly
//                 if (response.success) {
//                     // Clear error messages and reset the form
//                     $('#error-message').empty();
//                     $('#signup-form')[0].reset();
//                     alert('Signup successful!'); // You can customize this success message
//                 } else if (response.error) {
//                     // Display the error message under the Confirm Password field
//                     $('#confirmPassword-error').text(response.error);
//                 }
//             },
        
//             error: function (error) {
//                 console.error('Error:', error);
//             },
//         });
//     });
// });


