// Browser Console Script to Fix Corrupted CR Extract
// INSTRUCTIONS:
// 1. Open your browser to the job details page: http://localhost:5173/job/683d863146f1e2a6ebe4b777
// 2. Open the browser console (F12 or right-click > Inspect > Console)
// 3. Paste this entire script into the console
// 4. Press Enter to execute

(async function fixCrExtract() {
  const jobId = '684aa14e9806a7e283b5b521';

  try {
    console.log('Calling fix endpoint...');

    const response = await fetch(`http://localhost:5000/api/operations/jobs/${jobId}/fix-crextract`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Success:', data);
      if (data.fixed) {
        alert('CR Extract data has been fixed! Please refresh the page to see the changes.');
        window.location.reload();
      } else {
        alert('No corruption found in the data.');
      }
    } else {
      console.error('❌ Error:', data);
      alert(`Error: ${data.message || 'Failed to fix data'}`);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    alert(`Network error: ${error.message}`);
  }
})();
