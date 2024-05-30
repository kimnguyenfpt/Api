var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');


const multer = require('multer'); 
//Thiết lập nơi lưu trữ và tên file 

let storage = multer.diskStorage({ 
destination: function (req, file, cb) { 
cb(null, './public/images') 
}, 
filename: function (req, file, cb) { 
cb(null, file.originalname) 
} 
}) 
//Kiểm tra file upload 
function checkFileUpLoad(req, file, cb){ 
if(!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)){ 
return cb(new Error('Bạn chỉ được upload file ảnh')); 
} 
cb(null, true); 
} 
//Upload file 
let upload = multer({ storage: storage, fileFilter: checkFileUpLoad }); 
// Import model
const connectDb = require('../models/db');

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.get('/products',async(req, res, next)=>{
    const db=await connectDb();
    const productsCollection = db.collection('products');
    const products = await productsCollection.find().toArray();
    if (products) {
        res.status(200).json(products);
    }else{
        res.status(404).json({message: 'Not found'});
    }
});


//Lấy danh sách sản phẩm nổi bật
router.get('/products',async(req, res, next)=>{   //,authenToken
    const db=await connectDb();
    const productsCollection = db.collection('products');
    const products = await productsCollection.find({hot: 1}).toArray();
    if (products) {
        res.status(200).json(products);
    }else{
        res.status(404).json({message: 'Not found'});
    }
});


//Lấy danh sách sản phẩm theo Mã danh mục: 

router.get('/products/categoryid/:id', async (req, res, next) => {
    const categoryId = parseInt(req.params.id); // Chuyển đổi id từ chuỗi sang số
    const db = await connectDb();
    const productsCollection = db.collection('products');

    try {
        // Truy vấn tìm tất cả sản phẩm thuộc danh mục đó
        const products = await productsCollection.find({ categoryId: categoryId }).toArray();
        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'No products found for this category' });
        }
    } catch (error) {
        console.error('Error fetching products by category id:', error);
        res.status(500).send('Server error');
    }
});

//Lấy danh sách sản phẩm theo Tên danh mục

router.get('/products/categoryname/:categoryName', async (req, res, next) => {
    const db = await connectDb();
    const categoriesCollection = db.collection('categories');
    const productsCollection = db.collection('products');
    
    const categoryName = req.params.categoryName;
    
    
    const category = await categoriesCollection.findOne({ name: categoryName }).then(category => {
        if (!category) {
            res.status(404).json({ message: 'Không tìm thấy danh mục' });
            return null; 
        }
        return category;
    }).catch(err => {
        res.status(500).json({ message: 'Not Found' });
        return null; 
    });

    if (!category) return;

    const categoryId = category.id;
    
   
    await productsCollection.find({ categoryId: categoryId }).toArray().then(products => {
        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'No products found for this category' });
        }
    }).catch(err => {
        res.status(500).json({ message: 'Error accessing the database', error: err });
    });
});



//Tìm kiếm sản phẩm

router.get('/products/search/:name', async (req, res, next) => {
    const db = await connectDb();
    const productCollection = db.collection('products');
    const product_name = req.params.name;
    
    const data = await productCollection.find({name: {$regex:product_name, $options: 'i'}}).toArray();
    if(data){
        res.status(200).json(data);
    }else{
        res.status(404).json({Message: 'Not found'})
    }
});

//Lấy danh sách sản phẩm và sắp xếp theo tăng dần về giá và giới hạn số lượng

router.get('/products/sort/asc/limit/:limit', async (req, res) => {
    const db = await connectDb();
    const productsCollection = db.collection('products');
    const limit = parseInt(req.params.limit, 10); // Lấy giới hạn số lượng từ tham số đường dẫn

    // Kiểm tra nếu giới hạn không phải là số hoặc nhỏ hơn 1
    if (isNaN(limit) || limit < 1) {
        return res.status(400).json({ message: 'Giới hạn phải là số dương' });
    }

    try {
        const products = await productsCollection.find({})
                                                 .sort({ price: 1 }) // Sắp xếp theo giá tăng dần
                                                 .limit(limit) // Sử dụng giới hạn từ tham số đường dẫn
                                                 .toArray();

        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'No products found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving products', error });
    }
});


//Lấy danh sách sản phẩm và sắp xếp theo giảm dần về giá và giới hạn số lượng

router.get('/products/sort/desc/limit/:limit', async (req, res) => {
    const db = await connectDb();
    const productsCollection = db.collection('products');
    const limit = parseInt(req.params.limit, 10); // Lấy giới hạn số lượng từ tham số đường dẫn

    // Kiểm tra nếu giới hạn không phải là số hoặc nhỏ hơn 1
    if (isNaN(limit) || limit < 1) {
        return res.status(400).json({ message: 'Giới hạn phải là số dương' });
    }

    try {
        const products = await productsCollection.find({})
                                                 .sort({ price: -1 }) // Sắp xếp theo giá giảm dần
                                                 .limit(limit) // Sử dụng giới hạn từ tham số đường dẫn
                                                 .toArray();

        if (products.length > 0) {
            res.status(200).json(products);
        } else {
            res.status(404).json({ message: 'No products found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving products', error });
    }
});




//Thêm sản phẩm

router.post('/products', upload.single('img'), async (req, res, next) => {
    let { name,  price, description } = req.body;
    let img = req.file ? `${req.file.originalname}` : null; 

    const db = await connectDb();
    const productsCollection = db.collection('products');
    
    let lastProduct = await productsCollection.find().sort({ id: -1 }).limit(1).toArray();
    let id = lastProduct[0] ? lastProduct[0].id + 1 : 1;

    let newProduct = { id, name, img , price, description }; 

    await productsCollection.insertOne(newProduct);
    if (newProduct) {
        res.status(200).json(newProduct);
    } else {
        res.status(404).json({ message: 'Not found' });
    }
});


//sửa sản phẩm
router.put('/products/:id',upload.single('img'),async(req,res,next)=>{
    let id = req.params.id;
    const db= await connectDb();
    const productsCollection = db.collection('products');
    let {name, price, description, categoryId} =req.body;
    if (req.file) {
        var img = req.file.originalname;
    }else{
        let product = await productsCollection.findOne({id: parseInt(id)});
        var img = product.img;
        
    }
    let editProduct = {name, price, categoryId, img, description};
    product = await productsCollection.updateOne({ id: parseInt(id) },  { $set: editProduct });
    if (product) {
        res.status(200).json(editProduct);
    }else{
        res.status(404).json({message: 'Not found'});
    }
});

//show chi tiết 1 sản phẩm
router.get('/products/:id',async(req, res, next)=>{
    const db=await connectDb();
    const productsCollection = db.collection('products');
    let id=req.params.id;
    const product = await productsCollection.findOne({id: parseInt(id)});
    if (product) {
        res.status(200).json(product);
    }else{
        res.status(404).json({message: 'Not found'});
    }
});

//Lấy danh sách sản phẩm theo trang và giới hạn số lượng: 

router.get('/products/page/:page/limit/:limit', async (req, res, next) => {
    const db = await connectDb();
    const productsCollection = db.collection('products');

    const page = parseInt(req.params.page);
    const limit = parseInt(req.params.limit);
    const skip = (page - 1) * limit;

    try {
        const totalProducts = await productsCollection.countDocuments(); // Count total products
        const totalPages = Math.ceil(totalProducts / limit); // Calculate total pages

        const products = await productsCollection.find({})
            .skip(skip)
            .limit(limit)
            .toArray();

        // Return both products and total pages
        res.status(200).json({ products, totalPages });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// xóa sản phẩm

router.delete('/products/:id', async (req, res, next) => {
    let id=req.params.id;
    const db=await connectDb();
    const productsCollection = db.collection('products');
    let product = await productsCollection.deleteOne({id: parseInt(id)});
    if(product){
        res.status(200).json({message: 'Xóa thành công'});
    }else{
        res.status(404).json({message: 'Not found'});
    }
});


//Trả về danh sách danh mục

router.get('/categories',async(req, res, next)=>{
    const db=await connectDb();
    const categoriesCollection = db.collection('categories');
    const categories = await categoriesCollection.find().toArray();
    if (categories) {
        res.status(200).json(categories);
    }else{
        res.status(404).json({message: 'Not found'});
    }
});

//show chi tiết 1 danh mục
router.get('/categories/:id',async(req, res, next)=>{
    const db=await connectDb();
    const categoriesCollection = db.collection('categories');
    let id=req.params.id;
    const categories = await categoriesCollection.findOne({id: parseInt(id)});
    if (categories) {
        res.status(200).json(categories);
    }else{
        res.status(404).json({message: 'Not found'});
    }
});

//thêm danh mục

router.post('/categories', upload.single('img'), async (req, res, next) => {
    let { name } = req.body;
    let img = req.file ? `${req.file.originalname}` : null; // Lấy đường dẫn đầy đủ của tệp tin

    const db = await connectDb();
    const categoriesCollection = db.collection('categories');
    
    let lastCategory = await categoriesCollection.find().sort({ id: -1 }).limit(1).toArray();
    let id = lastCategory[0] ? lastCategory[0].id + 1 : 1;

    let newCategory = { id, name, img }; // Thêm thuộc tính 'img' vào đối tượng category

    await categoriesCollection.insertOne(newCategory);
    if (newCategory) {
        res.status(200).json(newCategory);
    } else {
        res.status(404).json({ message: 'Not found' });
    }
});

//sửa danh mục
router.put('/categories/:id',upload.single('img'),async(req,res,next)=>{
    let id = req.params.id;
    const db= await connectDb();
    const categoriesCollection = db.collection('categories');
    let {name} =req.body;
    if (req.file) {
        var img = req.file.originalname;
    }else{
        let category = await categoriesCollection.findOne({id: parseInt(id)});
        var img = category.img;
        
    }
    let editcategory = {name, img};
    category = await categoriesCollection.updateOne({ id: parseInt(id) },  { $set: editcategory });
    if (category) {
        res.status(200).json(editcategory);
    }else{
        res.status(404).json({message: 'Not found'});
    }
});

//xóa danh mục

router.delete('/categories/:id', async (req, res, next) => {
    let id=req.params.id;
    const db=await connectDb();
    const categoriesCollection = db.collection('categories');
    let categories = await categoriesCollection.deleteOne({id: parseInt(id)});
    if(categories){
        res.status(200).json({message: 'Xóa thành công'});
    }else{
        res.status(404).json({message: 'Not found'});
    }
});


router.get('/users', async (req, res) => {
    try {
        const db = await connectDb();
        const userCollection = db.collection('users');
        const users = await userCollection.find({}).toArray();
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi lấy danh sách người dùng" });
    }
});

//dang nhập
router.post('/users/register', async (req, res, next) => {
    try {
        let { email, password, username } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
        }

        const db = await connectDb();
        const userCollection = db.collection('users');
        let user = await userCollection.findOne({ email: email });
        if (user) {
            return res.status(409).json({ message: "Email đã tồn tại" });
        } else {
            const salt = bcrypt.genSaltSync(10);
            let hashPassword = bcrypt.hashSync(password, salt);

            if (!password || !hashPassword) {
                return res.status(500).json({ message: "Lỗi khi mã hóa mật khẩu" });
            }

            let newUser = { email, password: hashPassword, username, role: 'user' };
            let result = await userCollection.insertOne(newUser);

            // Tạo token cho người dùng mới
            const token = jwt.sign({ id: result.insertedId, email: newUser.email }, 'secretkey', { expiresIn: '600s' });

            console.log(result);
            return res.status(200).json({ message: "Đăng ký thành công", token: token });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi khi thêm người dùng mới" });
    }
});




//chức nang dang nhap su dung token

const jwt = require('jsonwebtoken')
router.post('/users/login', async (req, res, next) => {
    let { email, password } = req.body;
    const db = await connectDb();
    const userCollection = db.collection('users');

    let user = await userCollection.findOne({ email: email });

    if (user) {
        // Sử dụng await để chờ kết quả từ bcrypt.compare()
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
            const token = jwt.sign(
                { email: user.email, role: user.user },
                'secretkey',
                { expiresIn: '600s' }
            );
            res.status(200).json({ token: token });
        } else {
            res.status(403).json({ message: 'Email hoặc mật khẩu không đúng' });
        }
    } else {
        res.status(403).json({ message: 'Email này chưa đăng kí' });
    }
});
//Xác thực token 
function authenToken(req, res, next){ 
    //Truy cập vào header để lấy authorization
    const bearerHeader = req.headers['authorization']; 
    //kiểm tra authorization có dữ liệu không
    if(typeof bearerHeader !== 'undefined'){ 
        //nếu có thì cắt value ra và lấy phần tử thứ 2 là token có index là 1
      const bearerToken = bearerHeader.split(' ')[1]; 
      //gán cho nó vào biến token
      req.token = bearerToken; 
      //sử dụng thư viện JWT để xác thực với khóa bí mật secretkey coi khớp không
      jwt.verify(req.token, 'secretkey', (err, authData)=>{ 
        if(err){ 
            //nếu lỗi không có quyền truy cập
          res.status(403).json({message: "Không có quyền truy cập"}); 
        }else{ 
            //nếu không lỗi thì tiếp tục hàm nhúng vào hàm nhúng xác thực vào
          next(); 
        } 
      }) 
    }else{ 
      res.status(403).json({message: "Không có quyền truy cập"}); 
    } 
}



module.exports = router;
