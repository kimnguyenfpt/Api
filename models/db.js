const { MongoClient } = require('mongodb'); // nhúng thư viện mongo đã cài vào

const url = "mongodb://localhost:27017"; // khia báo url đã kết nối
// khai báo tên database
const dbName = 'bookshop'; 
//hàm kết nối
async function connectDb() { 
const client = new MongoClient(url); 
await client.connect(); 
console.log('Kết nối thành công đến server'); 
return client.db(dbName); 
} 
module.exports = connectDb; 