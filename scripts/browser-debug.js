// Browser console'da çalıştırılacak debug kodu
console.log('🔍 Debug: Task Definitions API testi...');

// API'ye istek at
fetch('/api/task-definitions')
  .then(response => {
    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Headers:', response.headers);
    
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  })
  .then(data => {
    console.log('✅ API Response Data:', data);
    console.log('📊 Görev tanımı sayısı:', data.length);
  })
  .catch(error => {
    console.error('❌ API Error:', error);
  });
