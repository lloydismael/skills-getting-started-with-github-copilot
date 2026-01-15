document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let messageTimer;

  const showMessage = (text, statusClass = "info") => {
    if (messageTimer) {
      clearTimeout(messageTimer);
    }
    messageDiv.textContent = text;
    messageDiv.className = `message ${statusClass}`;
    messageDiv.classList.remove("hidden");
    messageTimer = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  };

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsTitle = document.createElement("h5");
        participantsTitle.textContent = "Participants";
        participantsSection.appendChild(participantsTitle);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";

        if (details.participants.length === 0) {
          const emptyItem = document.createElement("li");
          emptyItem.className = "participants-empty";
          emptyItem.textContent = "No participants yet";
          participantsList.appendChild(emptyItem);
        } else {
          details.participants.forEach((participant) => {
            const participantItem = document.createElement("li");
            participantItem.className = "participant-item";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = participant;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "participant-remove";
            removeButton.setAttribute("aria-label", `Remove ${participant}");
            removeButton.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4.5 4.5L11.5 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M11.5 4.5L4.5 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            `;

            removeButton.addEventListener("click", async () => {
              try {
                const deleteResponse = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );

                const deleteResult = await deleteResponse.json();

                if (deleteResponse.ok) {
                  showMessage(deleteResult.message, "success");
                  await fetchActivities();
                } else {
                  showMessage(deleteResult.detail || "Failed to unregister participant", "error");
                }
              } catch (error) {
                showMessage("Failed to unregister participant. Please try again.", "error");
                console.error("Error removing participant:", error);
              }
            });

            participantItem.appendChild(nameSpan);
            participantItem.appendChild(removeButton);
            participantsList.appendChild(participantItem);
          });
        }

        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }

    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
