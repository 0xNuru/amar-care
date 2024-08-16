document.addEventListener("DOMContentLoaded", function () {
  const uploadButton = document.getElementById("uploadButton");
  const submitButton = document.getElementById("submitButton");
  const fileInput = document.getElementById("prescriptionUpload");
  const modal = new bootstrap.Modal(document.getElementById("exampleModal"));
  newModal = "";

  // When the upload button is clicked, trigger the file input
  uploadButton.addEventListener("click", function () {
    fileInput.click();
  });

  let selectedResultName = "";

  // Attach event listener to all buttons with the class 'place-order-btn'
  const placeOrderButtons = document.querySelectorAll(".place-order-btn");

  placeOrderButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Get the result name from the data attribute
      selectedResultName = button.getAttribute("data-result-name");
      selectedCategory = button.getAttribute("data-result-category");
      submitButton.style.display = "none";
      uploadButton.style.display = "inline-block";
      console.log(selectedCategory);

      // Show the prescription verifier modal
      if (selectedCategory === "pharmaceutical ") {
        console.log(selectedCategory + "in if");
        newModal = new bootstrap.Modal(
          document.getElementById("prescription-verifier")
        );
        newModal.show();
      } else {
        console.log(selectedCategory + "in else");
        newModal = new bootstrap.Modal(document.getElementById("exampleModal"));
        newModal.show();
      }
    });
  });

  // When a file is selected, show the submit button and hide the upload button
  fileInput.addEventListener("change", function () {
    if (fileInput.files.length > 0) {
      uploadButton.style.display = "none";
      submitButton.style.display = "inline-block";
    }
  });

  submitButton.addEventListener("click", function () {
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    const url = `https://medical-presciption-detector.onrender.com/process-image/${encodeURIComponent(
      selectedResultName
    )}`;

    fetch(url, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data["drugExist"] && data["isPrescription"]) {
          newModal.hide();
          modal.show();
        } else if (data["isPrescription"] == false) {
          newModal.hide();
          newModal = new bootstrap.Modal(
            document.getElementById("not-presciption")
          );
          newModal.show();
        } else if (data["drugExist"] == false) {
          newModal.hide();
          newModal = new bootstrap.Modal(document.getElementById("not-drug"));
          newModal.show();
        } else {
          newModal.hide();
          newModal = new bootstrap.Modal(
            document.getElementById("error-modal")
          );
          const errorMessageElement = document.querySelector(".error-text");
          errorMessageElement.innerText =
            error["detail"] ||
            "An unexpected error occurred. Please try again.";
          newModal.show();
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        newModal.hide();
        newModal = new bootstrap.Modal(document.getElementById("error-modal"));
        const errorMessageElement = document.querySelector(".error-text");
        errorMessageElement.innerText =
          error["detail"] || "An unexpected error occurred. Please try again.";
        newModal.show();
      })
      .finally(() => {
        // Reset the file input so the same file can be uploaded again
        fileInput.value = "";
        // Hide the submit button again and show the upload button
        submitButton.style.display = "none";
        uploadButton.style.display = "inline-block";
      });
  });
});
