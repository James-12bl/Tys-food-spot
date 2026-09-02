import { showToast, hidePageLoader } from './main.js';

function submitContact(e) {
  e.preventDefault();
  const name = document.getElementById('cName').value;
  const email = document.getElementById('cEmail').value;
  const subject = document.getElementById('cSubject').value;
  const message = document.getElementById('cMessage').value;

  const inquiries = JSON.parse(localStorage.getItem('tys_inquiries')) || [];
  inquiries.push({ name, email, subject, message, date: new Date().toISOString() });
  localStorage.setItem('tys_inquiries', JSON.stringify(inquiries));

  showToast('Message sent successfully! We will get back to you soon.');
  document.querySelector('.contact-form').reset();
}

document.addEventListener('DOMContentLoaded', () => {
  window.submitContact = submitContact;
  hidePageLoader();
});
