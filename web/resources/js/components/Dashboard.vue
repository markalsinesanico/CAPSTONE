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

      <section class="stats">
        <div class="card">Number Of Rooms<br><span>{{ rooms.length }}</span></div>
        <div class="card">Number Of Items<br><span>{{ items.length }}</span></div>
        <div class="card">Returned Items<br><span>{{ returnedItemsCount }}</span></div>
      </section>

      <section class="content">
        <div class="calendar">
          <h3>Select date</h3>
          <input type="date" v-model="selectedDate" @change="updateAvailableItems" />
          <h4 style="margin-top: 10px;">Available Items</h4>
          <div id="availableItemsList">
            <div v-if="availableList.length === 0"><p>No items available for this date.</p></div>
            <div
              v-for="(item, index) in availableList"
              :key="index"
              class="item-card"
            >
              <img v-if="sortBy === 'EQUIPMENT'" :src="item.image" :alt="item.name" />
              <h4>{{ item.name }}</h4>
              <p>Available Slots: {{ item.slots }}</p>
            </div>
          </div>
        </div>

        <div class="schedule">
          <div class="filter-search">
            <label for="sort">Sort By:</label>
            <select id="sort" v-model="sortBy">
              <option value="EQUIPMENT">EQUIPMENT</option>
              <option value="ROOMS">ROOMS</option>
            </select>
            <input type="text" placeholder="Search" />
          </div>

          <div class="calendar-grid">
            <!-- Time labels -->
            <div
              v-for="(time, i) in timeSlots"
              :key="'time-' + i"
              class="time-label"
              :style="{ gridRow: i + 2, gridColumn: 1 }"
            >
              {{ time }}
            </div>
            <!-- Day headers -->
            <div
              v-for="(day, i) in days"
              :key="'day-' + i"
              class="day-header"
              :style="{ gridRow: 1, gridColumn: i + 2 }"
            >
              {{ day }}
            </div>
            <!-- Events -->
            <div
              v-for="(event, i) in processedEvents"
              :key="'event-' + i"
              class="event-block"
              :style="{
                gridColumn: event.col,
                gridRow: event.rowStart + ' / span ' + event.rowSpan,
                background: event.color,
                border: highlightedEventId === event.id ? '3px solid #ffd700' : 'none',
                boxShadow: highlightedEventId === event.id ? '0 0 10px rgba(255, 215, 0, 0.5)' : '0 2px 8px rgba(0,0,0,0.08)'
              }"
              @click="showDetails(event.name, event.idnum, event.year, event.dept, event.course, event.startTime + ' - ' + event.endTime, event.startTime, event.endTime, event.type || 'N/A', event.account || 'N/A', event.id, event.source, event.item)"
            >
              <strong>{{ event.name }}</strong>
              <div>{{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}</div>
              <div>{{ event.item }}</div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Modal -->
    <div class="modal" v-if="modalVisible" @click.self="closeModal">
      <div class="modal-content">
        <button class="close-x-btn" @click="closeModal" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></svg>
        </button>
        <h3>Event Details</h3>
        <div v-if="modalData.fromQR" class="qr-scan-indicator">
          <span style="color: #28a745; font-size: 12px;">📱 Scanned from Mobile Receipt</span>
        </div>
        <table class="event-details-table">
          <tr><td><strong>Name:</strong></td><td>{{ modalData.name }}</td></tr>
          <tr><td><strong>ID number:</strong></td><td>{{ modalData.idnum }}</td></tr>
          <tr><td><strong>Year:</strong></td><td>{{ modalData.year }}</td></tr>
          <tr><td><strong>Department:</strong></td><td>{{ modalData.dept }}</td></tr>
          <tr><td><strong>Course:</strong></td><td>{{ modalData.course }}</td></tr>
          <tr><td><strong>Item/Room:</strong></td><td>{{ modalData.itemName || 'N/A' }}</td></tr>
          <tr><td><strong>Date:</strong></td><td>{{ modalData.date }}</td></tr>
          <tr><td><strong>IN:</strong></td><td>{{ modalData.in }}</td></tr>
          <tr><td><strong>OUT:</strong></td><td>{{ modalData.out }}</td></tr>
        </table>
        <div class="modal-actions">
          <div class="action-buttons">
            <button class="return-btn" @click="markAsReturned" v-if="!modalData.returned">Return</button>
            <button class="overdue-btn" @click="markAsOverdue" v-if="!modalData.returned && !modalData.overdue">Overdue Request</button>
          </div>
          <button class="close-btn" @click="closeModal">Close</button>
        </div>
      </div>
    </div>

    <!-- Floating QR Scan Button -->
    <button class="qr-fab" @click="openQrModal">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    </button>
    <!-- QR Code Modal -->
    <div class="qr-modal" v-if="showQrModal" @click.self="closeQrModal">
      <div class="qr-modal-content">
        <h3>Scan QR Code</h3>
        <div v-if="qrError" class="qr-error">
          <p style="color: #e74c3c; font-size: 14px;">{{ qrError }}</p>
        </div>
        <qrcode-stream 
          @decode="onDecode" 
          @init="onInit"
          @error="onError"
          :camera="camera"
          :track="paintBoundingBox"
          :constraints="cameraConstraints"
        />
        <div v-if="qrResult">
          <p :style="{ color: qrResult.includes('Invalid') ? '#e74c3c' : qrResult.includes('successfully') ? '#2ecc71' : '#007e3a' }">
            <strong>{{ qrResult.includes('Invalid') ? 'Error:' : qrResult.includes('successfully') ? 'Success:' : 'QR Code Detected!' }}</strong>
          </p>
          <p style="font-size: 12px; color: #666;">
            {{ qrResult.includes('Invalid') ? 'Please scan a valid receipt QR code.' : 
               qrResult.includes('successfully') ? 'Receipt details are now displayed.' : 
               'Processing receipt data...' }}
          </p>
        </div>
        <div class="qr-instructions">
          <p style="font-size: 12px; color: #666; margin-top: 10px;">
            Point your camera at a receipt QR code from the mobile app
          </p>
        </div>
        <div class="qr-test-buttons">
          <button class="test-btn" @click="testQRCode">Test QR</button>
          <button class="close-btn" @click="closeQrModal">Close</button>
        </div>
      </div>
    </div>

    <!-- Enhanced Custom Alert System -->
    <div v-if="showAlert" class="custom-alert" :class="alertType" :style="alertStyle">
      <div class="alert-content">
        <div class="alert-icon">
          <span v-if="alertType === 'success'">✅</span>
          <span v-else-if="alertType === 'error'">❌</span>
          <span v-else-if="alertType === 'warning'">⚠️</span>
          <span v-else>ℹ️</span>
        </div>
        <div class="alert-message">
          <h4>{{ alertTitle }}</h4>
          <p>{{ alertMessage }}</p>
        </div>
        <button class="alert-close" @click="closeAlert">&times;</button>
      </div>
    </div>
  </div>
</template>

<script>
import { QrcodeStream } from 'vue-qrcode-reader';
import axios from "axios";
export default {
  components: { QrcodeStream },
  data() {
    return {
      selectedDate: new Date().toISOString().substr(0, 10),
      modalVisible: false,
      modalData: {
        name: '',
        idnum: '',
        type: '',
        year: '',
        dept: '',
        course: '',
        date: '',
        in: '',
        out: '',
        account: '',
        id: null,
        source: null,
        returned: false,
        overdue: false,
        itemName: ''
      },
      availableItems: [],
      timeSlots: [
        "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM",
        "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
        "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
        "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM",
        "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM"
      ],
      borrowers: [],
      roomRequests: [],
      rooms: [],
      items: [],
      returnedItemsCount: 0,
      sortBy: 'EQUIPMENT',
      events: [], // <-- REMOVE all hardcoded events, keep as empty array

      showQrModal: false,
      qrResult: '',
      qrError: '',
      camera: 'auto',
      cameraConstraints: {
        video: {
          facingMode: 'environment' // Use back camera if available
        }
      },
      highlightedEventId: null, // Track which event is highlighted
      userEmail: '',
      
      // Custom Alert System
      showAlert: false,
      alertType: 'info', // success, error, warning, info
      alertTitle: '',
      alertMessage: '',
      alertDuration: 5000
    };
  },
  computed: {
    alertStyle() {
      return {
        animation: this.showAlert ? 'slideInRight 0.3s ease-out' : 'slideOutRight 0.3s ease-in',
        transform: this.showAlert ? 'translateX(0)' : 'translateX(100%)'
      };
    },
    processedEvents() {
      let eventsToMap = [];
      if (this.sortBy === 'ROOMS') {
        // Map room requests to events (include id and source) - filter out returned items
        eventsToMap = this.roomRequests
          .filter(r => !r.returned)
          .map(r => ({
            id: r.id,
            name: r.name,
            idnum: r.borrower_id,
            year: r.year,
            dept: r.department,
            course: r.course,
            startTime: `${r.date} ${r.time_in}`,
            endTime: `${r.date} ${r.time_out}`,
            item: r.room?.name || 'Room',
            color: '#007bff', // blue for rooms
            source: 'room'
          }));
      } else {
        // Map equipment borrowers to events (include id and source) - filter out returned items
        eventsToMap = this.borrowers
          .filter(b => !b.returned)
          .map(b => ({
            id: b.id,
            name: b.name,
            idnum: b.borrower_id,
            year: b.year,
            dept: b.department,
            course: b.course,
            startTime: `${b.date} ${b.time_in}`,
            endTime: `${b.date} ${b.time_out}`,
            item: b.item?.name || 'N/A',
            color: '#43a047', // green for equipment
            source: 'item'
          }));
      }

      // Only for the selected date
      const eventsForDay = eventsToMap.filter(e =>
        e.startTime.startsWith(this.selectedDate)
      );
      const sorted = [...eventsForDay].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );

      // Assign columns based on overlap
      const columns = [];
      const result = [];
      sorted.forEach(event => {
        const rowStart = this.getRowIndex(event.startTime.split(' ')[1]);
        const rowEnd = this.getRowIndex(event.endTime.split(' ')[1]);
        const rowSpan = rowEnd - rowStart + 1;
        let col = 2;
        while (
          columns[col] &&
          columns[col].some(
            e => rowStart < e.end && rowEnd > e.start
          )
        ) {
          col++;
        }
        if (!columns[col]) columns[col] = [];
        columns[col].push({ start: rowStart, end: rowEnd });
        result.push({
          ...event,
          rowStart: rowStart,
          rowSpan: rowSpan,
          col
        });
      });
      return result;
    },
    availableList() {
      if (this.sortBy === 'ROOMS') {
        return this.rooms.map(room => ({
          name: room.name,
          slots: room.quantity,
          image: '/img/room.png'
        }));
      } else {
        return this.items.map(item => ({
          name: item.name,
          slots: item.qty,
          image: item.image_url || '/img/no-image.png'
        }));
      }
    },
    itemSlotAvailability() {
      // Only for EQUIPMENT
      if (this.sortBy !== 'EQUIPMENT') return [];

      // Build a table: [{ name, slots: [slot1, slot2, ...] }]
      return this.items.map(item => {
        // For each time slot, count overlapping requests
        const slots = this.timeSlots.map((slot, idx) => {
          // Build time string for this slot
          const [hour, min, ampm] = slot.match(/(\d+):(\d+) (\w+)/).slice(1);
          let slotHour = parseInt(hour, 10);
          if (ampm === 'PM' && slotHour !== 12) slotHour += 12;
          if (ampm === 'AM' && slotHour === 12) slotHour = 0;
          const slotTime = `${slotHour.toString().padStart(2, '0')}:${min}`;

          // Find requests for this item, this date, overlapping this slot
          const overlapping = this.borrowers.filter(b =>
            b.item?.name === item.name &&
            b.date === this.selectedDate &&
            slotTime >= b.time_in &&
            slotTime < b.time_out
          ).length;

          // If all slots are taken, mark as 'Full'
          if (overlapping >= item.qty) return 'Full';
          // Otherwise, show available slots
          return item.qty - overlapping;
        });
        return {
          name: item.name,
          slots,
          image: item.image_url || '/img/no-image.png'
        };
      });
    },
  },
  methods: {
    getRowIndex(time) {
      const [hour, minute] = time.split(":").map(Number);
      // 7:00 AM is row 2 (since row 1 is header), 7:30 is row 3, 8:00 is row 4, etc.
      return (hour - 7) * 2 + (minute === 30 ? 3 : 2);
    },
    getTimeRange(startRow, span) {
      const startIndex = startRow - 2; // since row 2 is index 0 in timeSlots
      const endIndex = startIndex + span;
      return `${this.timeSlots[startIndex]} - ${this.timeSlots[endIndex] || ''}`;
    },
    formatTime(datetime) {
      // Expects 'YYYY-MM-DD HH:mm'
      const time = datetime.split(' ')[1];
      let [hour, minute] = time.split(':').map(Number);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12;
      return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
    },
    showDetails(name, idnum, year, dept, course, datetime, startTime, endTime, type = 'N/A', account = 'N/A', id = null, source = null, itemName = 'N/A') {
      // Extract and normalize date and times
      const extractDatePart = (s) => {
        if (!s) return '';
        const m = s.match(/\d{4}-\d{2}-\d{2}/);
        return m ? m[0] : (s.split(' ')[0] || s);
      };

      const extractTimePart = (s) => {
        if (!s) return '';
        // match HH:MM or HH:MM:SS
        const m = s.match(/(\d{1,2}:\d{2})(:\d{2})?/);
        if (m) return m[1];
        // fallback for T08:00:00 style
        const m2 = s.match(/T(\d{2}:\d{2})/);
        return m2 ? m2[1] : '';
      };

      const toAmPm = (hhmm) => {
        if (!hhmm) return '-';
        const parts = hhmm.split(':');
        if (parts.length < 2) return hhmm;
        let hour = parseInt(parts[0], 10);
        const minute = parts[1];
        const suffix = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return `${hour}:${minute} ${suffix}`;
      };

      const rawDate = startTime ? startTime.split(' ')[0] : '';
      const rawIn = startTime ? startTime.split(' ')[1] || '' : '';
      const rawOut = endTime ? endTime.split(' ')[1] || '' : '';

      const date = extractDatePart(rawDate);
      const inTime = toAmPm(extractTimePart(rawIn));
      const outTime = toAmPm(extractTimePart(rawOut));

      console.log('showDetails called', { name, idnum, year, dept, course, datetime, startTime, endTime, type, account, id, source });
      
      // Find the original item to get the returned and overdue status
      let returned = false;
      let overdue = false;
      if (source === 'room') {
        const roomRequest = this.roomRequests.find(r => r.id === id);
        returned = roomRequest ? roomRequest.returned : false;
        overdue = roomRequest ? roomRequest.overdue : false;
      } else {
        const borrower = this.borrowers.find(b => b.id === id);
        returned = borrower ? borrower.returned : false;
        overdue = borrower ? borrower.overdue : false;
      }
      
      this.modalData = { name, idnum, type, year, dept, course, date, in: inTime, out: outTime, account, id, source, returned, overdue, itemName };
      this.modalVisible = true;
    },
    closeModal() {
      this.modalVisible = false;
      this.highlightedEventId = null; // Clear highlight when modal is closed
    },
    async markAsReturned() {
      console.log('markAsReturned called with modalData:', this.modalData);
      
      if (!this.modalData.id || !this.modalData.source) {
        console.error('Missing item information:', { id: this.modalData.id, source: this.modalData.source });
        alert('Error: Missing item information');
        return;
      }

      try {
        const endpoint = this.modalData.source === 'room' 
          ? `/api/room-requests/${this.modalData.id}/return`
          : `/api/requests/${this.modalData.id}/return`;
        
        await axios.patch(endpoint);
        
        // Update the local data
        if (this.modalData.source === 'room') {
          const roomRequest = this.roomRequests.find(r => r.id === this.modalData.id);
          if (roomRequest) {
            roomRequest.returned = true;
          }
        } else {
          const borrower = this.borrowers.find(b => b.id === this.modalData.id);
          if (borrower) {
            borrower.returned = true;
          }
        }
        
        this.modalData.returned = true;
        this.showCustomAlert('success', 'Success!', 'Item marked as returned successfully!');
        this.closeModal();
        
        // Refresh data to remove returned items from timeslot
        await this.refreshData();
      } catch (error) {
        console.error('Error marking item as returned:', error);
        this.showCustomAlert('error', 'Error!', 'Failed to mark item as returned. Please try again.');
      }
    },
    async markAsOverdue() {
      console.log('markAsOverdue called with modalData:', this.modalData);
      
      if (!this.modalData.id || !this.modalData.source) {
        console.error('Missing item information:', { id: this.modalData.id, source: this.modalData.source });
        alert('Error: Missing item information');
        return;
      }

      try {
        const endpoint = this.modalData.source === 'room' 
          ? `/api/room-requests/${this.modalData.id}/overdue`
          : `/api/requests/${this.modalData.id}/overdue`;
        
        const response = await axios.post(endpoint);
        
        // Show success message with the notification details
        this.showCustomAlert('success', 'Overdue Notification Sent!', 'I hope you return what you borrowed at the time it should be returned. Thank you');
        this.closeModal();
        
        console.log('Overdue notification sent successfully:', response.data);
      } catch (error) {
        console.error('Error sending overdue notification:', error);
        this.showCustomAlert('error', 'Error!', 'Failed to send overdue notification. Please try again.');
      }
    },
    updateAvailableItems() {
      this.availableItems = [
        { name: 'Projector', slots: 2, image: '/img/projector.png' },
        { name: 'Speaker', slots: 1, image: '/img/speaker.png' },
        { name: 'Room A', slots: 1, image: '/img/room.png' }
      ];
    },
    onDecode(result) {
      this.qrResult = result;
      this.processQRCode(result);
    },
    openQrModal() {
      this.qrResult = '';
      this.qrError = '';
      this.showQrModal = true;
    },
    closeQrModal() {
      this.showQrModal = false;
    },
    async onInit(promise) {
      try {
        await promise;
        this.qrError = '';
        console.log('QR Scanner initialized successfully');
      } catch (error) {
        console.error('QR Scanner initialization failed:', error);
        if (error.name === 'NotAllowedError') {
          this.qrError = 'Camera access denied. Please allow camera access and try again.';
        } else if (error.name === 'NotFoundError') {
          this.qrError = 'No camera found. Please connect a camera and try again.';
        } else if (error.name === 'NotSupportedError') {
          this.qrError = 'Camera not supported. Please use a different browser.';
        } else if (error.name === 'NotReadableError') {
          this.qrError = 'Camera is already in use by another application.';
        } else {
          this.qrError = 'Camera initialization failed. Please try again.';
        }
      }
    },
    onError(error) {
      console.error('QR Scanner error:', error);
      this.qrError = 'QR Scanner error: ' + error.message;
    },
    paintBoundingBox(detectedCodes, ctx) {
      // Optional: Add visual feedback for detected QR codes
      detectedCodes.forEach(code => {
        const { x, y, width, height } = code.boundingBox;
        ctx.strokeStyle = '#007e3a';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
      });
    },
    processQRCode(qrResult) {
      try {
        console.log('QR Code detected:', qrResult);
        console.log('QR Code type:', typeof qrResult);
        console.log('QR Code length:', qrResult.length);
        
        // Parse the QR code JSON data
        const qrData = JSON.parse(qrResult);
        console.log('Parsed QR data:', qrData);
        console.log('QR Data type:', qrData.type);
        console.log('QR Data keys:', Object.keys(qrData));
        
        // Validate that this is a receipt QR code
        if (!qrData.type || (!qrData.type.includes('receipt'))) {
          console.log('Invalid QR code type:', qrData.type);
          console.log('Expected type to include "receipt"');
          this.qrResult = 'Invalid QR code. Please scan a valid receipt QR code.';
          setTimeout(() => {
            this.qrResult = '';
          }, 3000);
          return;
        }
        
        // Map QR data to Event Details modal format
        const eventDetails = {
          name: qrData.borrowerName || '-',
          idnum: qrData.schoolId || '-',
          type: qrData.type === 'item_request_receipt' ? 'Equipment' : 'Room',
          year: qrData.year || '-',
          dept: qrData.department || '-',
          course: qrData.course || '-',
          date: qrData.date || '-',
          in: qrData.timeIn || '-',
          out: qrData.timeOut || '-',
          account: qrData.borrowerName || '-',
          id: qrData.requestId || null,
          source: qrData.type === 'item_request_receipt' ? 'item' : 'room',
          returned: false, // QR receipts are typically for active requests
          itemName: qrData.itemName || qrData.roomName || '-'
        };
        
        // Close QR modal and directly show the Event Details modal
        this.closeQrModal();
        this.showEventDetailsFromQR(eventDetails);
        
        console.log('QR Code processed successfully:', eventDetails);
        console.log('Event Details modal should now be visible');
        
        // Show success message briefly
        this.qrResult = 'Receipt data loaded successfully!';
        setTimeout(() => {
          this.qrResult = '';
        }, 2000);
      } catch (error) {
        console.error('Error processing QR code:', error);
        console.log('Error message:', error.message);
        console.log('Raw QR result that failed to parse:', qrResult);
        console.log('QR result type:', typeof qrResult);
        console.log('QR result length:', qrResult ? qrResult.length : 'null/undefined');
        this.qrResult = 'Invalid QR code format. Please scan a valid receipt QR code.';
        setTimeout(() => {
          this.qrResult = '';
        }, 3000);
      }
    },
    showEventDetailsFromQR(eventDetails) {
      console.log('Showing Event Details from QR data:', eventDetails);
      
      // Set the selected date to the event date to show the event in calendar
      this.selectedDate = eventDetails.date;
      
      // Set the correct sort type (EQUIPMENT or ROOMS)
      this.sortBy = eventDetails.source === 'item' ? 'EQUIPMENT' : 'ROOMS';
      
      // Format the time for display
      const formatTimeForDisplay = (timeStr) => {
        if (!timeStr || timeStr === '-') return '-';
        // Convert 24-hour format to 12-hour format if needed
        const time = timeStr.includes(':') ? timeStr : `${timeStr}:00`;
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      };
      
      // Directly show the Event Details modal with QR data
      this.modalData = {
        name: eventDetails.name,
        idnum: eventDetails.idnum,
        type: eventDetails.type,
        year: eventDetails.year,
        dept: eventDetails.dept,
        course: eventDetails.course,
        date: eventDetails.date,
        in: formatTimeForDisplay(eventDetails.in),
        out: formatTimeForDisplay(eventDetails.out),
        account: eventDetails.account,
        id: eventDetails.id,
        source: eventDetails.source,
        returned: eventDetails.returned,
        overdue: eventDetails.overdue || false,
        itemName: eventDetails.itemName,
        fromQR: true // Mark that this came from QR scan
      };
      
      this.modalVisible = true;
      
      // Show success message
      this.qrResult = 'Event Details displayed from QR code!';
      setTimeout(() => {
        this.qrResult = '';
      }, 2000);
    },
    findAndHighlightEvent(eventDetails) {
      console.log('Finding event for QR receipt:', eventDetails);
      console.log('Current borrowers data:', this.borrowers);
      console.log('Current room requests data:', this.roomRequests);
      
      // Set the selected date to the event date to show the event in calendar
      this.selectedDate = eventDetails.date;
      
      // Set the correct sort type (EQUIPMENT or ROOMS)
      this.sortBy = eventDetails.source === 'item' ? 'EQUIPMENT' : 'ROOMS';
      
      // Wait for the calendar to update, then find and highlight the event
      this.$nextTick(() => {
        // Find the matching event in the current data with more flexible matching
        let foundEvent = null;
        
        if (eventDetails.source === 'item') {
          // Look in borrowers data with multiple matching strategies
          console.log('Searching in borrowers data...');
          foundEvent = this.borrowers.find(b => {
            console.log('Checking borrower:', b);
            // Try multiple matching criteria
            const idMatch = b.id === eventDetails.id;
            const nameIdDateMatch = b.name === eventDetails.name && 
                                  b.borrower_id === eventDetails.idnum && 
                                  b.date === eventDetails.date;
            const nameDateMatch = b.name === eventDetails.name && b.date === eventDetails.date;
            const idDateMatch = b.borrower_id === eventDetails.idnum && b.date === eventDetails.date;
            
            console.log('Matching results:', { idMatch, nameIdDateMatch, nameDateMatch, idDateMatch });
            return idMatch || nameIdDateMatch || nameDateMatch || idDateMatch;
          });
        } else {
          // Look in room requests data with multiple matching strategies
          console.log('Searching in room requests data...');
          foundEvent = this.roomRequests.find(r => {
            console.log('Checking room request:', r);
            // Try multiple matching criteria
            const idMatch = r.id === eventDetails.id;
            const nameIdDateMatch = r.name === eventDetails.name && 
                                  r.borrower_id === eventDetails.idnum && 
                                  r.date === eventDetails.date;
            const nameDateMatch = r.name === eventDetails.name && r.date === eventDetails.date;
            const idDateMatch = r.borrower_id === eventDetails.idnum && r.date === eventDetails.date;
            
            console.log('Matching results:', { idMatch, nameIdDateMatch, nameDateMatch, idDateMatch });
            return idMatch || nameIdDateMatch || nameDateMatch || idDateMatch;
          });
        }
        
        if (foundEvent) {
          console.log('Found matching event:', foundEvent);
          
          // Highlight the found event
          this.highlightedEventId = foundEvent.id;
          
          // Open the Event Details modal for the found event
          this.showDetails(
            foundEvent.name,
            foundEvent.borrower_id,
            foundEvent.year,
            foundEvent.department,
            foundEvent.course,
            `${foundEvent.date} ${foundEvent.time_in} - ${foundEvent.time_out}`,
            `${foundEvent.date} ${foundEvent.time_in}`,
            `${foundEvent.date} ${foundEvent.time_out}`,
            eventDetails.source === 'item' ? 'Equipment' : 'Room',
            foundEvent.name,
            foundEvent.id,
            eventDetails.source,
            eventDetails.source === 'item' ? foundEvent.item?.name : foundEvent.room?.name
          );
          
          // Show success message
          this.qrResult = 'Event found and highlighted!';
          setTimeout(() => {
            this.qrResult = '';
          }, 2000);
          
          // Remove highlight after 5 seconds
          setTimeout(() => {
            this.highlightedEventId = null;
          }, 5000);
        } else {
          console.log('No exact match found, trying fallback search...');
          
          // Fallback: Try to find any event with similar data
          let fallbackEvent = null;
          
          if (eventDetails.source === 'item') {
            // Try to find by name only, or by date only
            fallbackEvent = this.borrowers.find(b => 
              b.name === eventDetails.name || 
              b.date === eventDetails.date ||
              b.borrower_id === eventDetails.idnum
            );
          } else {
            fallbackEvent = this.roomRequests.find(r => 
              r.name === eventDetails.name || 
              r.date === eventDetails.date ||
              r.borrower_id === eventDetails.idnum
            );
          }
          
          if (fallbackEvent) {
            console.log('Found fallback event:', fallbackEvent);
            this.highlightedEventId = fallbackEvent.id;
            
            // Open the Event Details modal for the fallback event
            this.showDetails(
              fallbackEvent.name,
              fallbackEvent.borrower_id,
              fallbackEvent.year,
              fallbackEvent.department,
              fallbackEvent.course,
              `${fallbackEvent.date} ${fallbackEvent.time_in} - ${fallbackEvent.time_out}`,
              `${fallbackEvent.date} ${fallbackEvent.time_in}`,
              `${fallbackEvent.date} ${fallbackEvent.time_out}`,
              eventDetails.source === 'item' ? 'Equipment' : 'Room',
              fallbackEvent.name,
              fallbackEvent.id,
              eventDetails.source,
              eventDetails.source === 'item' ? fallbackEvent.item?.name : fallbackEvent.room?.name
            );
            
            this.qrResult = 'Similar event found and highlighted!';
            setTimeout(() => {
              this.qrResult = '';
            }, 2000);
            
            setTimeout(() => {
              this.highlightedEventId = null;
            }, 5000);
          } else {
            console.log('No matching event found in calendar');
            console.log('Available borrowers:', this.borrowers.map(b => ({ id: b.id, name: b.name, date: b.date, borrower_id: b.borrower_id })));
            console.log('Available room requests:', this.roomRequests.map(r => ({ id: r.id, name: r.name, date: r.date, borrower_id: r.borrower_id })));
            alert('Event not found in current calendar data. Please check:\n1. The item may have already been returned\n2. The data may not be loaded yet\n3. Try refreshing the page\n4. Check the console for debugging information');
          }
        }
      });
    },
    testQRCode() {
      // Test QR code data that matches the format from Profile.tsx
      // Use today's date to ensure the event appears in the calendar
      const today = new Date().toISOString().substr(0, 10);
      const testQRData = {
        requestId: 999, // Use a unique ID for testing
        borrowerName: 'Test User',
        itemName: 'Test Projector',
        schoolId: 'TEST-12345',
        year: '3rd Year',
        department: 'Computer Science',
        course: 'BSIT',
        date: today,
        timeIn: '9:00 AM',
        timeOut: '11:00 AM',
        timestamp: new Date().toISOString(),
        type: 'item_request_receipt'
      };
      
      const testQRString = JSON.stringify(testQRData);
      console.log('Testing with QR data:', testQRString);
      this.processQRCode(testQRString);
    },
    async refreshData() {
      console.log('Refreshing data...');
      try {
        await Promise.all([
          this.fetchBorrowers(),
          this.fetchRoomRequests(),
          this.fetchRooms(),
          this.fetchItems(),
          this.fetchReturnedItemsCount()
        ]);
        console.log('Data refreshed successfully');
        this.qrResult = 'Data refreshed successfully!';
        setTimeout(() => {
          this.qrResult = '';
        }, 2000);
      } catch (error) {
        console.error('Error refreshing data:', error);
        this.qrResult = 'Error refreshing data. Please try again.';
        setTimeout(() => {
          this.qrResult = '';
        }, 3000);
      }
    },
    showAllEvents() {
      console.log('=== ALL AVAILABLE EVENTS ===');
      console.log('Borrowers (Equipment):', this.borrowers);
      console.log('Room Requests:', this.roomRequests);
      console.log('Processed Events:', this.processedEvents);
      
      // Show in alert for easy viewing
      const borrowerInfo = this.borrowers.map(b => 
        `ID: ${b.id}, Name: ${b.name}, Date: ${b.date}, Borrower ID: ${b.borrower_id}`
      ).join('\n');
      
      const roomInfo = this.roomRequests.map(r => 
        `ID: ${r.id}, Name: ${r.name}, Date: ${r.date}, Borrower ID: ${r.borrower_id}`
      ).join('\n');
      
      alert(`Borrowers (${this.borrowers.length}):\n${borrowerInfo}\n\nRoom Requests (${this.roomRequests.length}):\n${roomInfo}`);
    },
    manualQRInput() {
      const qrData = prompt('Enter QR code data (JSON format):');
      if (qrData) {
        try {
          // Validate it's JSON
          JSON.parse(qrData);
          this.processQRCode(qrData);
        } catch (error) {
          alert('Invalid JSON format. Please enter valid QR code data.');
        }
      }
    },
    testQRCode() {
      // Test QR code data that matches the format from Receipt.tsx
      const today = new Date().toISOString().substr(0, 10);
      const testQRData = {
        type: 'item_request_receipt',
        requestId: 123,
        borrowerName: 'Test User',
        schoolId: 'TEST-12345',
        year: '3rd Year',
        department: 'Computer Science',
        course: 'BSIT',
        date: today,
        timeIn: '09:00',
        timeOut: '11:00',
        itemName: 'Test Projector',
        unitCode: 'UNIT-123',
        timestamp: new Date().toISOString()
      };
      
      const testQRString = JSON.stringify(testQRData);
      console.log('Testing with QR data:', testQRString);
      console.log('This should open the Event Details modal with all request information');
      this.processQRCode(testQRString);
    },
    // Enhanced Custom Alert Methods
    showCustomAlert(type, title, message, duration = 5000) {
      this.alertType = type;
      this.alertTitle = title;
      this.alertMessage = message;
      this.alertDuration = duration;
      this.showAlert = true;
      
      // Auto-hide after duration
      if (duration > 0) {
        setTimeout(() => {
          this.closeAlert();
        }, duration);
      }
    },
    showSuccess(title, message, duration = 4000) {
      this.showCustomAlert('success', title, message, duration);
    },
    showError(title, message, duration = 6000) {
      this.showCustomAlert('error', title, message, duration);
    },
    showWarning(title, message, duration = 5000) {
      this.showCustomAlert('warning', title, message, duration);
    },
    showInfo(title, message, duration = 4000) {
      this.showCustomAlert('info', title, message, duration);
    },
    closeAlert() {
      this.showAlert = false;
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
    },
    async fetchBorrowers() {
      try {
        const res = await axios.get("/api/requests");
        this.borrowers = res.data;
      } catch {
        this.showCustomAlert('error', 'Error!', 'Failed to fetch requests.');
      }
    },
    async fetchRoomRequests() {
      try {
        const res = await axios.get("/api/room-requests");
        this.roomRequests = res.data;
      } catch {
        this.showCustomAlert('error', 'Error!', 'Failed to fetch room requests.');
      }
    },
    async fetchRooms() {
      try {
        const res = await axios.get("/api/rooms");
        this.rooms = res.data;
      } catch {
        this.showCustomAlert('error', 'Error!', 'Failed to fetch rooms.');
      }
    },
    async fetchItems() {
      try {
        const res = await axios.get("/api/items");
        this.items = res.data;
      } catch {
        this.showCustomAlert('error', 'Error!', 'Failed to fetch items.');
      }
    },
    async fetchReturnedItemsCount() {
      try {
        // Fetch returned equipment requests
        const equipmentRes = await axios.get("/api/requests");
        const returnedEquipment = equipmentRes.data.filter(item => 
          item.returned === true || item.returned === 1 || item.returned === "1"
        );

        // Fetch returned room requests
        const roomRes = await axios.get("/api/room-requests");
        const returnedRooms = roomRes.data.filter(item => 
          item.returned === true || item.returned === 1 || item.returned === "1"
        );

        // Count total returned items
        this.returnedItemsCount = returnedEquipment.length + returnedRooms.length;
      } catch (error) {
        console.error('Error fetching returned items count:', error);
        this.showCustomAlert('error', 'Error!', 'Failed to fetch returned items count.');
      }
    },
    updateSchedule() {
      // Logic to update the schedule based on sortBy selection
      // This could involve fetching data again or sorting the existing data
      if (this.sortBy === 'EQUIPMENT') {
        // Sort by equipment name
        this.borrowers.sort((a, b) => a.item.name.localeCompare(b.item.name));
      } else {
        // Sort by room (assuming room is part of the borrower data)
        this.borrowers.sort((a, b) => a.room.localeCompare(b.room));
      }
    }
  },
  mounted() {
    this.updateAvailableItems();
    // Get user email from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.email) {
      this.userEmail = user.email;
    }
    this.fetchBorrowers();
    this.fetchRoomRequests();
    this.fetchRooms();
    this.fetchItems();
    this.fetchReturnedItemsCount();
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

    body {
      background: #f5f5f5;
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

.stats {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  flex: 1;
  min-width: 150px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.card span {
  font-size: 24px;
  color: #2ecc71;
}

.content {
  display: flex;
  margin-top: 30px;
  gap: 20px;
  flex-wrap: wrap;
}

.calendar {
  background: #f1eaff;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
  flex: 1;
  min-width: 200px;
}

.calendar input {
  margin-top: 10px;
  padding: 6px;
  border-radius: 5px;
  border: 1px solid #ccc;
  width: 100%;
}

.schedule {
  flex: 3;
  min-width: 280px;
}

.filter-search {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.filter-search select,
.filter-search input {
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #ccc;
  flex: 1;
  min-width: 130px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: 120px repeat(5, 1fr);
  grid-template-rows: 40px repeat(26, 32px); /* Adjust for more time slots if needed */
  background: #fff;
  border: 1px solid #ccc;
}

.time-label, .day-header {
  border-bottom: 1px solid #e0e0e0;
  border-right: 1px solid #ccc;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  text-align: right;
  padding: 0 10px;
  line-height: 32px;
}

.day-header {
  background: #f5f5f5;
  color: #333;
  text-align: center;
  font-weight: bold;
  border-bottom: 2px solid #ccc;
  border-right: 1px solid #ccc;
  font-size: 15px;
  line-height: 40px;
}

.calendar-grid > div:not(.day-header):not(.time-label):not(.event-block) {
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  border-right: 1px solid #eee;
}

.event-block {
  color: #fff;
  border-radius: 6px;
  padding: 8px 6px;
  font-size: 14px;
  border: none;
  box-sizing: border-box;
  margin: 2px 4px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  cursor: pointer;
  line-height: 1.2;
}

.modal {
  display: flex !important;
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background-color: rgba(0,0,0,0.5);
  justify-content: center;
  align-items: center;
  z-index: 2000;
}
.close-x-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  z-index: 10;
}
.close-x-btn svg {
  display: block;
  stroke: #333;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 300px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.modal-content h3 {
  margin-bottom: 10px;
}

.modal-content p {
  font-size: 14px;
  margin-bottom: 5px;
}

.close-btn {
  margin-top: 10px;
  padding: 8px 12px;
  background: #2ecc71;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.item-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 10px;
  margin-top: 10px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
}

.item-card img {
  max-width: 80px;
  height: auto;
  margin-bottom: 5px;
}

.item-card h4 {
  margin: 5px 0;
  font-size: 14px;
}

.item-card p {
  font-size: 12px;
  color: #555;
}

.qr-fab {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #007e3a;
  color: #fff;
  border: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  z-index: 1001;
  cursor: pointer;
  transition: background 0.2s;
}
.qr-fab:hover {
  background: #18bc9c;
}
.qr-modal {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1002;
}
.qr-modal-content {
  background: #fff;
  padding: 24px 20px 16px 20px;
  border-radius: 12px;
  min-width: 320px;
  max-width: 90vw;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
  text-align: center;
}
.qr-modal-content h3 {
  margin-bottom: 12px;
}
.qr-error {
  background: #ffeaea;
  border: 1px solid #e74c3c;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 12px;
}
.qr-instructions {
  text-align: center;
  margin-top: 8px;
}
.qr-test-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 16px;
}
.test-btn {
  background: #6f42c1;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 12px;
}
.test-btn:hover {
  background: #5a32a3;
}
.qr-modal-content p {
  margin: 10px 0 0 0;
}
.close-btn {
  margin-top: 16px;
  padding: 8px 16px;
  background: #2ecc71;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.event-details-table {
  width: 100%;
  margin-bottom: 16px;
  border-collapse: collapse;
}
.event-details-table td {
  padding: 4px 8px;
  font-size: 14px;
}
.event-modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 10px;
}
.approve-btn {
  background: #2ecc71;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: bold;
}
.reject-btn {
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: bold;
}
.return-btn {
  background: #f39c12;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: bold;
}

.overdue-btn {
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 5px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: bold;
  margin-right: 8px;
}

.overdue-btn:hover {
  background: #c0392b;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
  .stats, .content, .filter-search {
    flex-direction: column;
  }
  .calendar, .schedule {
    width: 100%;
  }
  .event {
  position: relative;
  padding: 4px;
  margin-top: 4px;
  font-size: 12px;
  cursor: pointer;
}
.event strong {
  display: block;
  font-size: 13px;
}
.item-card {
  background: #f4f4f4;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 10px;
  text-align: center;
}
.item-card img {
  width: 50px;
  height: 50px;
  object-fit: contain;
}
.calendar-grid {
  display: grid;
  grid-template-columns: 100px repeat(5, 1fr);
  gap: 4px;
  margin-top: 20px;
}
.time-slot {
  background: #f0f0f0;
  font-size: 12px;
  padding: 4px;
  border-right: 1px solid #ccc;
  text-align: right;
  padding-right: 8px;
  }
}

/* Enhanced Custom Alert System */
.custom-alert {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  max-width: 400px;
  min-width: 300px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: slideInRight 0.3s ease-out;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.custom-alert.success {
  background: linear-gradient(135deg, #d4edda, #c3e6cb);
  border-left: 4px solid #28a745;
}

.custom-alert.error {
  background: linear-gradient(135deg, #f8d7da, #f5c6cb);
  border-left: 4px solid #dc3545;
}

.custom-alert.warning {
  background: linear-gradient(135deg, #fff3cd, #ffeaa7);
  border-left: 4px solid #ffc107;
}

.custom-alert.info {
  background: linear-gradient(135deg, #d1ecf1, #bee5eb);
  border-left: 4px solid #17a2b8;
}

.alert-content {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  gap: 12px;
}

.alert-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-message {
  flex: 1;
}

.alert-message h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
}

.alert-message p {
  margin: 0;
  font-size: 14px;
  color: #495057;
  line-height: 1.4;
}

.alert-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.alert-close:hover {
  background-color: rgba(0, 0, 0, 0.1);
  color: #495057;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.custom-alert.success .alert-icon {
  animation: pulse 0.6s ease-in-out;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .custom-alert {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
    min-width: auto;
  }
}
</style>