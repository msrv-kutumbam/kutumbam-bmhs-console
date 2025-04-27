
function sendOtpEmail(recipientEmail, otp) {
  var subject = "Your OTP Code";
  var body = "" +
    "<html><body>" +
    "<div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px; max-width: 400px;'>" +
    "<h2 style='color: #333;'>OTP Verification</h2>" +
    "<p style='font-size: 16px;'>Your OTP for verification is:</p>" +
    "<h1 style='color: #007bff; text-align: center;'>" + otp + "</h1>" +
    "<p style='font-size: 14px; color: #666;'>This OTP is valid for 5 minutes.</p>" +
    "</div>" +
    "</body></html>";
  
  try {
    GmailApp.sendEmail(recipientEmail, subject, "", {htmlBody: body});
    Logger.log("OTP sent successfully to: " + recipientEmail);
    return otp; // Return OTP for validation (store it securely)
  } catch (e) {
    Logger.log("Error sending email: " + e.toString());
    return null;
  }
}

function testSendOtpEmail() {
  var testEmail = "test@example.com";
  var testOtp = Math.floor(100000 + Math.random() * 900000); // Generate a test OTP
  var result = sendOtpEmail(testEmail, testOtp);
  
  if (result) {
    Logger.log("Test passed: OTP sent successfully.");
  } else {
    Logger.log("Test failed: OTP not sent.");
  }
}

function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var userEmail = params.email;
    if (!userEmail) {
      return ContentService.createTextOutput(JSON.stringify({error: "Email is required"})).setMimeType(ContentService.MimeType.JSON);
    }
    
    var otp = Math.floor(100000 + Math.random() * 900000); // Generate OTP
    sendOtpEmail(userEmail, otp);
    
    return ContentService.createTextOutput(JSON.stringify({message: "OTP sent successfully"})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({error: "An error occurred"})).setMimeType(ContentService.MimeType.JSON);
  }
}

// Frontend function to send OTP request
async function RRrequestOtp(email) {
  // DEPLOYED URL VITE_OTP_MAILER="https://script.google.com/macros/s/AKfycbyHDc6hj2UAi2NpumLcMIIyBInFYdktyJ8p_-buZ_0aUA0wzyA_OCkI1UxBkgA1NvdF/exec"

  const url = "YOUR_DEPLOYED_APP_SCRIPT_URL"; // Replace with the actual Web App URL
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  
  const data = await response.json();
  return data;
}


async function requestOtp(email) {

    // const url = import.meta.env.VITE_OTP_MAILER ;
    const url = "https://script.google.com/macros/s/AKfycbyHDc6hj2UAi2NpumLcMIIyBInFYdktyJ8p_-buZ_0aUA0wzyA_OCkI1UxBkgA1NvdF/exec"

    // const url = "https://cors-anywhere.herokuapp.com/script.google.com/macros/s/AKfycbyHDc6hj2UAi2NpumLcMIIyBInFYdktyJ8p_-buZ_0aUA0wzyA_OCkI1UxBkgA1NvdF/exec"
    // const url = "https://script.google.com/macros/s/AKfycbxjSRp5HFkxp0EimKNgnxPEDpFPH-P5DcQxyjtBNUw/dev"
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      console.log("---", data )
      return data;
    } catch (error) {
      console.error("Error requesting OTP:", error);
      return { error: "Failed to request OTP" };
    }
}
requestOtp( "msrv177@gmail.com")