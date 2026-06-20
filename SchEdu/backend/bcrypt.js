const bcrypt = require('bcryptjs');

// The password you want to test
const passwordToTest = 'pass123';

// The bcrypt hash from your database for admin@example.com
const storedHash = '$2a$10$yUkbMg6ReMmvBOZTWuSVgeSLkzVnNJcNHKhMjdboQjk.VzYY.Pn9K';

// Compare password with stored hash
bcrypt.compare(passwordToTest, storedHash, (err, result) => {
  if (err) {
    console.error('Error comparing password:', err);
    process.exit(1);
  }

  if (result) {
    console.log('Password is correct!');
  } else {
    console.log('Password is incorrect.');
  }
});
