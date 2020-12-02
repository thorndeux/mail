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
      load_mailbox('sent')
      console.log(result)
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
      list_item.classList.add("list-group-item", "list-group-item-action", "py-2", "px-3");
      list_item.addEventListener('click', () => view_email(email.id));
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
      }
      // Append email to list group
      list_group.append(list_item);
    })
    // Append list group to emails view
    emails_view.append(list_group);
  })
}

function view_email(email_id) {

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
    const subject = document.createElement('h3');
    subject.innerHTML = email.subject;
    email_view.append(subject);

    const sender = document.createElement('div');
    sender.className = "row";
    sender.innerHTML = "<div class='col'>Sent by: " + email.sender + "</div>" +
                       "<div class='col'>On: " + email.timestamp + "</div>";
    email_view.append(sender);

    const recipients = document.createElement('div');
    recipients.innerHTML = "Recipients: " + email.recipients;
    email_view.append(recipients);

    const body = document.createElement('div');
    body.innerHTML = email.body;
    email_view.append(body);    
  })
  
  // Mark email as read
  fetch('/emails/' + email_id, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })

}