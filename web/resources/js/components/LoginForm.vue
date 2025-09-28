<template>
    <div class="login-container">
      <div class="login-box">
        <h2 class="login-title">Login</h2>
        <form @submit.prevent="handleLogin">
          <input v-model="email" type="email" placeholder="Email" required />
          <input v-model="password" type="password" placeholder="Password" required />
          <button type="submit">Login</button>
          <p v-if="error" class="error">{{ error }}</p>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        email: '',
        password: '',
        error: ''
      };
    },
    methods: {
      async handleLogin() {
        try {
          const response = await axios.post('/api/login', {
            email: this.email,
            password: this.password
          });
          
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          // Set axios default header for future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
          
          this.$router.push('/dashboard');
        } catch (err) {
          if (err.response && err.response.status === 403) {
            this.error = 'Only admin can log in';
          } else if (err.response && err.response.status === 401) {
            this.error = 'Invalid email or password';
          } else {
            this.error = 'Login failed. Please try again.';
          }
        }
      }
    }
  };
  </script>
  
  <style scoped>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #fefcbf; /* light yellow */
  }
  
  .login-box {
    background-color: #d9f99d; /* light green */
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0px 4px 10px rgba(0, 128, 0, 0.3);
    width: 300px;
  }
  
  .login-title {
    text-align: center;
    margin-bottom: 20px;
    color: #065f46;
  }
  
  input {
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    border: 1px solid #9ae6b4;
    border-radius: 5px;
  }
  
  button {
    width: 100%;
    padding: 10px;
    background-color: #68d391;
    border: none;
    border-radius: 5px;
    color: #fff;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s;
  }
  
  button:hover {
    background-color: #48bb78;
  }
  
  .error {
    color: red;
    text-align: center;
    margin-top: 10px;
  }
  </style>
  