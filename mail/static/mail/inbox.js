var emails_view
var email_view
var compose_view

document.addEventListener('DOMContentLoaded', function() {

  // Store views in variables
  emails_view = document.querySelector('#emails-view')
  email_view = document.querySelector('#email-view')
  compose_view = document.querySelector('#compose-view')

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  emails_view.style.display = 'none';
  email_view.style.display = 'none';
  compose_view.style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Send email
  document.querySelector('form').onsubmit = () => {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result)      
      
      // If an error occurs, display an alert
      if (result.error) {
        const errorAlert = document.createElement('div');
        errorAlert.classList.add("alert", "alert-danger");
        errorAlert.innerHTML = result.error;
        compose_view.insertBefore(errorAlert, compose_view.firstChild);
      }

      // If sucessfull, remove any alerts and load the sent mailbox
      else {
        const alertCheck = document.querySelector('.alert')
        if (alertCheck) {
          alertCheck.remove();
        }
        load_mailbox('sent');
      }
    })

    return false;
  };
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  emails_view.style.display = 'block';
  email_view.style.display = 'none';
  compose_view.style.display = 'none';

  // Show the mailbox name
  emails_view.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get appropriate emails
  fetch('/emails/' + mailbox, {
    method: 'GET'
  })
  .then(response => response.json())
  .then(result => {
    // Create a list group
    const list_group = document.createElement('div');
    list_group.classList.add("list-group");

    // Loop through emails
    result.forEach(email => {
      // Create a list item for each email...
      const list_item = document.createElement('div');
      list_item.classList.add("list-group-item", "list-group-item-action", "py-2", "px-3", "font-weight-bold");
      list_item.addEventListener('click', () => view_email(mailbox, email.id));
      // ...with a row...
      const row = document.createElement('div');
      row.classList.add("row");
      list_item.append(row);
      // ...containing columns for each relevant field.
      const cols = ["sender", "subject", "timestamp"]
      cols.forEach((colName, index) => {
        const col = document.createElement('div');
        if (index == 2) {
          col.classList.add("col-3", "text-right");
        }
        else {
          col.classList.add("col");
        }
        col.innerHTML = eval("email." + colName);
        row.append(col);
      })
      // Add styling for read emails
      if (email.read) {
        list_item.classList.add("list-group-item-secondary");
        list_item.classList.remove("font-weight-bold");
      }
      // Append email to list group
      list_group.append(list_item);
    })
    // Append list group to emails view
    emails_view.append(list_group);
  })
}

function view_email(mailbox, email_id) {

  // Clear content from email view
  email_view.innerHTML = "";

  // Show email and hide other views
  emails_view.style.display = 'none';
  email_view.style.display = 'block';
  compose_view.style.display = 'none';

  // Get appropriate email
  fetch('/emails/' + email_id, {
    method: 'GET'
  })
  .then(response => response.json())
  .then(email => {
    // Put email subject in a heading
    const subject = document.createElement('h3');
    subject.innerHTML = email.subject;
    email_view.append(subject);

    // Add a row with sender and timestamp
    const sender = document.createElement('div');
    sender.className = "row";
    sender.innerHTML = "<div class='col'><strong>Sent by:</strong> " + email.sender + "</div>" +
                       "<div class='col'><strong>On:</strong> " + email.timestamp + "</div>";
    email_view.append(sender);

    // Add recipients
    const recipients = document.createElement('div');
    recipients.innerHTML = "<strong>Recipients:</strong> " + email.recipients;
    email_view.append(recipients);

    // Add email content
    const body = document.createElement('div');
    body.classList.add("text-dark", "border-top", "mx-n2", "mt-2", "mb-n2", "p-2");
    const bodyParagraphs = email.body.replace(/(?:\r\n|\r|\n)/g, '<br>');
    body.innerHTML = bodyParagraphs;
    
    // For emails sent to the user (inbox and archived)
    const actions = document.createElement('div');
    if (mailbox === 'inbox' || mailbox === 'archive') {
      
      // Adjust body styling to account for buttons below
      body.classList.remove("mb-n2");
      body.classList.add("border-bottom", "mb-2");
      
      // Add action buttons to email
      actions.classList.add("d-flex", "justify-content-end");
      
      // Add reply button
      const replyButton = document.createElement('button');
      replyButton.classList.add("btn", "btn-sm", "btn-outline-primary", "mr-1");
      replyButton.innerHTML = "Reply";
      replyButton.addEventListener('click', () => reply(email));
      actions.append(replyButton);
      
      // Add archive/unarchive button
      const archiveButton = document.createElement('button');
      archiveButton.classList.add("btn", "btn-sm", "btn-outline-primary");
      if (!email.archived) {
        archiveButton.innerHTML = "Archive";
      }
      else {
        archiveButton.innerHTML = "Unarchive";
      }
      // Add event listener to the button
      archiveButton.addEventListener('click', () => archive(email.id, email.archived));
      actions.append(archiveButton);
    }

    // Append email body
    email_view.append(body);

    // Append action buttons if there are any
    if (actions.innerHTML) {
      email_view.append(actions)
    }
  })
  
  // Mark email as read
  fetch('/emails/' + email_id, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })

}

// Toggles the archived state of an email and loads the inbox
function archive(email_id, archived_state) {
    fetch('/emails/' + email_id, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !archived_state
    })
  })
  .then(() => load_mailbox('inbox'))
}

// Handles email replies
function reply(email)  {

  // Show compose view and hide other views
  emails_view.style.display = 'none';
  email_view.style.display = 'none';
  compose_view.style.display = 'block';

  // Pre-fill appropriate fields
  document.querySelector('#compose-recipients').value = email.sender;
  
  // Add 'Re: ' to subject, if there isn't any
  var subject = email.subject;
  if (!email.subject.startsWith("Re:")) {
    subject = "Re: " + subject;
  }
  document.querySelector('#compose-subject').value = subject;

  // Quote original email and place cursor at the start
  const body = "\r\n\r\nOn " + email.timestamp + " " +
    email.sender + " wrote:\r\n" + email.body;
  const composeBody = document.querySelector('#compose-body');
  composeBody.value = body;
  composeBody.focus();
  composeBody.setSelectionRange(0, 0);

  // Send email
  document.querySelector('form').onsubmit = () => {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log(result)      
      
      // If an error occurs, display an alert
      if (result.error) {
        const errorAlert = document.createElement('div');
        errorAlert.classList.add("alert", "alert-danger");
        errorAlert.innerHTML = result.error;
        compose_view.insertBefore(errorAlert, compose_view.firstChild);
      }

      // If sucessfull, remove any alerts and load the sent mailbox
      else {
        const alertCheck = document.querySelector('.alert')
        if (alertCheck) {
          alertCheck.remove();
        }
        load_mailbox('sent');
      }
    })

    return false;
  };
}