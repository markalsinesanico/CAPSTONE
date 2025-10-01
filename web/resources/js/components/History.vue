<template>
  <div class="container">
    <aside class="sidebar">
      <nav class="menu">
        <router-link to="/dashboard">DASHBOARD</router-link>
        <router-link to="/borrowers">BORROWERS</router-link>
        <router-link to="/appointment">APPOINTMENT</router-link>
        <router-link to="/history">HISTORY</router-link>
      </nav>
    </aside>

    <main class="main">
      <header class="topbar">
        <div class="logo">
          <img src="/img/logo.png" alt="Logo" />
          <div class="logo-text">
            <h2>SMART LINK</h2>
            <p>APPOINT & BORROW</p>
          </div>
        </div>
        <div class="user">
          {{ userEmail }}
          <button @click="logout" class="logout-btn">Logout</button>
        </div>
      </header>

      <section class="content">
        <div class="history-header">
          <h2>Returned Items History</h2>
          <div class="filter-controls">
            <label for="typeFilter">Filter by Type:</label>
            <select id="typeFilter" v-model="typeFilter">
              <option value="all">All Items</option>
              <option value="equipment">Equipment</option>
              <option value="rooms">Rooms</option>
            </select>
            <input 
              type="text" 
              placeholder="Search by name, ID, or course..." 
              v-model="searchQuery"
              class="search-input"
            />
            <button @click="fetchReturnedItems" class="refresh-btn">Refresh</button>
          </div>
        </div>

        <div class="history-content">
          <div v-if="filteredReturnedItems.length === 0" class="no-items">
            <p>No returned items found.</p>
          </div>
          
          <div v-else class="items-grid">
            <div 
              v-for="item in filteredReturnedItems" 
              :key="`${item.source}-${item.id}`"
              class="history-item"
            >
              <div class="item-header">
                <h3>{{ item.name }}</h3>
                <span class="item-type" :class="item.source">{{ item.source === 'room' ? 'Room' : 'Equipment' }}</span>
              </div>
              
              <div class="item-details">
                <div class="detail-row">
                  <span class="label">ID Number:</span>
                  <span class="value">{{ item.idnum }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Year:</span>
                  <span class="value">{{ item.year }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Department:</span>
                  <span class="value">{{ item.dept }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Course:</span>
                  <span class="value">{{ item.course }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span class="value">{{ formatDate(item.date) }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Time:</span>
                  <span class="value">{{ item.time_in }} - {{ item.time_out }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Item:</span>
                  <span class="value">{{ item.itemName }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Returned:</span>
                  <span class="value returned-date">{{ formatDate(item.returned_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      returnedItems: [],
      typeFilter: 'all',
      searchQuery: '',
      userEmail: ''
    };
  },
  computed: {
    filteredReturnedItems() {
      let filtered = this.returnedItems;
      
      // Filter by type
      if (this.typeFilter !== 'all') {
        filtered = filtered.filter(item => {
          if (this.typeFilter === 'equipment') return item.source === 'item';
          if (this.typeFilter === 'rooms') return item.source === 'room';
          return true;
        });
      }
      
      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
          item.name.toLowerCase().includes(query) ||
          item.idnum.toLowerCase().includes(query) ||
          item.course.toLowerCase().includes(query) ||
          item.dept.toLowerCase().includes(query)
        );
      }
      
      // Sort by returned date (most recent first)
      return filtered.sort((a, b) => new Date(b.returned_at) - new Date(a.returned_at));
    }
  },
  methods: {
    async fetchReturnedItems() {
      try {
        // Fetch returned equipment requests
        const equipmentRes = await axios.get("/api/requests");
        console.log('All equipment requests:', equipmentRes.data);
        
        const returnedEquipment = equipmentRes.data
          .filter(item => item.returned === true || item.returned === 1 || item.returned === "1")
          .map(item => ({
            id: item.id,
            name: item.name,
            idnum: item.borrower_id,
            year: item.year,
            dept: item.department,
            course: item.course,
            date: item.date,
            time_in: item.time_in,
            time_out: item.time_out,
            itemName: item.item?.name || 'N/A',
            source: 'item',
            returned_at: item.updated_at
          }));

        console.log('Filtered returned equipment:', returnedEquipment);

        // Fetch returned room requests
        const roomRes = await axios.get("/api/room-requests");
        console.log('All room requests:', roomRes.data);
        
        const returnedRooms = roomRes.data
          .filter(item => item.returned === true || item.returned === 1 || item.returned === "1")
          .map(item => ({
            id: item.id,
            name: item.name,
            idnum: item.borrower_id,
            year: item.year,
            dept: item.department,
            course: item.course,
            date: item.date,
            time_in: item.time_in,
            time_out: item.time_out,
            itemName: item.room?.name || 'N/A',
            source: 'room',
            returned_at: item.updated_at
          }));

        console.log('Filtered returned rooms:', returnedRooms);

        this.returnedItems = [...returnedEquipment, ...returnedRooms];
        console.log('Final returned items:', this.returnedItems);
      } catch (error) {
        console.error('Error fetching returned items:', error);
        alert('Failed to fetch returned items.');
      }
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },
    async logout() {
      try {
        await axios.post('/api/logout');
      } catch (e) {
        // ignore errors
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      this.$router.push('/');
    }
  },
  mounted() {
    // Get user email from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.email) {
      this.userEmail = user.email;
    }
    this.fetchReturnedItems();
  }
};
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Roboto', sans-serif;
}

.container {
  display: flex;
  flex-direction: row;
  min-height: 100vh;
  min-width: 100vw;
}

.sidebar {
  width: 220px;
  background: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
  padding: 30px 20px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.menu a {
  color: white;
  text-decoration: none;
  font-size: 16px;
  padding: 10px 15px;
  border-radius: 8px;
  transition: background 0.3s, color 0.3s;
}

.menu a.active,
.menu a:hover {
  background-color: #18bc9c;
  color: #ffffff;
}

.main {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-left: 0;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  background-color: #007e3a;
  padding: 10px 20px;
  color: white;
  border-radius: 8px;
}

.topbar .logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.topbar .logo img {
  height: 50px;
}

.topbar .logo-text h2 {
  font-size: 18px;
  color: white;
  margin: 0;
}

.topbar .logo-text p {
  font-size: 12px;
  color: white;
  margin: 0;
}

.topbar .user {
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 12px;
  border-radius: 20px;
  color: white;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
}

.logout-btn {
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 6px 12px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
  font-size: 12px;
}

.logout-btn:hover {
  background: #c0392b;
}

.content {
  margin-top: 30px;
}

.history-header {
  margin-bottom: 30px;
}

.history-header h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 28px;
}

.filter-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-controls label {
  font-weight: bold;
  color: #2c3e50;
}

.filter-controls select,
.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.search-input {
  min-width: 250px;
}

.refresh-btn {
  background: #007e3a;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
}

.refresh-btn:hover {
  background: #005a2a;
}

.history-content {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.no-items {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-size: 16px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.history-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  transition: box-shadow 0.2s;
}

.history-item:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #dee2e6;
}

.item-header h3 {
  color: #2c3e50;
  font-size: 18px;
  margin: 0;
}

.item-type {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.item-type.room {
  background: #007bff;
  color: white;
}

.item-type.item {
  background: #43a047;
  color: white;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-row .label {
  font-weight: bold;
  color: #495057;
  min-width: 100px;
}

.detail-row .value {
  color: #6c757d;
  text-align: right;
  flex: 1;
}

.returned-date {
  color: #28a745 !important;
  font-weight: bold;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
  
  .sidebar {
    flex-direction: row;
    width: 100%;
    padding: 10px;
    justify-content: space-around;
  }
  
  .menu {
    display: flex;
    gap: 10px;
  }
  
  .menu a {
    font-size: 14px;
    padding: 6px 10px;
  }
  
  .topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input {
    min-width: auto;
  }
  
  .items-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .detail-row .value {
    text-align: left;
  }
}
</style>
