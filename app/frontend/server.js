const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Add JSON body parser middleware
app.use(express.json());

// Proxy API requests to backend
app.get('/api/items', async (req, res) => {
    try {
        console.log('Fetching items from backend service...');
        const backendUrl = 'http://backend.app-namespace.svc.cluster.local/api/items';
        console.log('Backend URL:', backendUrl);
        
        const response = await fetch(backendUrl);
        console.log('Backend response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend error response:', errorText);
            throw new Error('Backend responded with status: ' + response.status + ' - ' + errorText);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Unexpected content type:', contentType);
            console.error('Response body:', text);
            throw new Error('Backend returned non-JSON response');
        }
        
        const data = await response.json();
        console.log('Successfully fetched items:', data);
        res.json(data);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ 
            error: 'Failed to fetch items',
            details: error.message,
            type: error.type || 'unknown'
        });
    }
});

// Handle POST requests to add items
app.post('/api/items', async (req, res) => {
    try {
        console.log('Adding new item to backend service...');
        const backendUrl = 'http://backend.app-namespace.svc.cluster.local/api/items';
        console.log('Backend URL:', backendUrl);
        
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });
        
        console.log('Backend response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend error response:', errorText);
            throw new Error('Backend responded with status: ' + response.status + ' - ' + errorText);
        }
        
        const data = await response.json();
        console.log('Successfully added item:', data);
        res.json(data);
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ 
            error: 'Failed to add item',
            details: error.message,
            type: error.type || 'unknown'
        });
    }
});

// Handle SSR for the main page
app.get('/', async (req, res) => {
    try {
        console.log('Fetching items for SSR...');
        const backendUrl = 'http://backend.app-namespace.svc.cluster.local/api/items';
        console.log('Backend URL:', backendUrl);
        
        const response = await fetch(backendUrl);
        console.log('Backend response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend error response:', errorText);
            throw new Error('Backend responded with status: ' + response.status + ' - ' + errorText);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Unexpected content type:', contentType);
            console.error('Response body:', text);
            throw new Error('Backend returned non-JSON response');
        }
        
        const items = await response.json();
        console.log('Successfully fetched items for SSR:', items);
        
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Simple Items App</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f5f5f5;
                    }
                    .container {
                        background-color: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                    button {
                        background-color: #4CAF50;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 16px;
                        margin-bottom: 20px;
                    }
                    button:hover {
                        background-color: #45a049;
                    }
                    #status {
                        margin: 10px 0;
                        color: #666;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        padding: 12px;
                        text-align: left;
                        border-bottom: 1px solid #ddd;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    tr:hover {
                        background-color: #f5f5f5;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Simple Items App</h1>
                    <button id="addButton">Add New Item</button>
                    <div id="status"></div>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Value</th>
                                <th>Created At</th>
                            </tr>
                        </thead>
                        <tbody id="itemsList">
                            ${items.map(item => `
                                <tr>
                                    <td>${item.id}</td>
                                    <td>${item.name}</td>
                                    <td>${item.value}</td>
                                    <td>${new Date(item.created_at).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <script>
                    document.getElementById('addButton').addEventListener('click', async () => {
                        try {
                            const response = await fetch('/api/items', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    name: 'Item ' + Date.now(),
                                    value: 1.00
                                }),
                            });

                            if (response.ok) {
                                document.getElementById('status').textContent = 'Item added successfully!';
                                window.location.reload();
                            } else {
                                const error = await response.json();
                                document.getElementById('status').textContent = 'Error adding item: ' + (error.details || error.error);
                            }
                        } catch (error) {
                            console.error('Error:', error);
                            document.getElementById('status').textContent = 'Error adding item: ' + error.message;
                        }
                    });
                </script>
            </body>
            </html>
        `;
        
        res.send(html);
    } catch (error) {
        console.error('Error rendering page:', error);
        res.status(500).send(
            '<div class="container">' +
            '<h1>Error</h1>' +
            '<p>Failed to load items: ' + error.message + '</p>' +
            '<p>Please check the backend service is running and accessible.</p>' +
            '</div>'
        );
    }
});

// Note: This server needs to run as root in production to bind to port 80
const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
}); 