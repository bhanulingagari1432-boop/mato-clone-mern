const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mato_clone";

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error:", err.message));

const userSchema = new mongoose.Schema({
  name: String, email: { type: String, unique: true }, password: String,
  isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: String, category: String, brand: String, price: Number,
  discount: { type: Number, default: 0 }, image: String,
  description: String, sizes: [String], colors: [String],
  rating: { type: Number, default: 4 }
}, { timestamps: true });

const cartSchema = new mongoose.Schema({
  userId: String, productId: String, quantity: { type: Number, default: 1 },
  size: String, color: String
}, { timestamps: true });

const wishlistSchema = new mongoose.Schema({
  userId: String, productId: String
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  userId: String, items: Array, total: Number,
  address: Object, status: { type: String, default: "Placed" }
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  productId: String, userId: String, userName: String,
  rating: Number, comment: String
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Cart = mongoose.model("Cart", cartSchema);
const Wishlist = mongoose.model("Wishlist", wishlistSchema);
const Order = mongoose.model("Order", orderSchema);
const Review = mongoose.model("Review", reviewSchema);

app.get("/", (req,res) => res.json({ message: "Mato Clone API running" }));

// REGISTER - intentionally no authentication/security middleware
app.post("/register", async (req,res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({message:"All fields required"});
    const exists = await User.findOne({email});
    if (exists) return res.status(409).json({message:"Email already registered"});
    const user = await User.create({name,email,password});
    res.status(201).json({message:"Registration successful", user:{id:user._id,name:user.name,email:user.email,isAdmin:user.isAdmin}});
  } catch(e) { res.status(500).json({message:e.message}); }
});

// LOGIN - simple DB check; no JWT/session/authentication
app.post("/login", async (req,res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({email,password});
    if (!user) return res.status(401).json({message:"Invalid email or password"});
    res.json({message:"Login successful", user:{id:user._id,name:user.name,email:user.email,isAdmin:user.isAdmin}});
  } catch(e) { res.status(500).json({message:e.message}); }
});

app.get("/users", async (req,res) => res.json(await User.find().select("-password")));

app.get("/products", async (req,res) => {
  const {search,category,sort} = req.query;
  const q = {};
  if(search) q.$or=[{name:{$regex:search,$options:"i"}},{brand:{$regex:search,$options:"i"}}];
  if(category && category !== "All") q.category=category;
  let query=Product.find(q);
  if(sort==="low") query=query.sort({price:1});
  if(sort==="high") query=query.sort({price:-1});
  if(sort==="new") query=query.sort({createdAt:-1});
  res.json(await query);
});

app.get("/products/:id", async(req,res)=>{
  const p=await Product.findById(req.params.id);
  if(!p) return res.status(404).json({message:"Product not found"});
  res.json(p);
});
app.post("/products", async(req,res)=>res.status(201).json(await Product.create(req.body)));
app.put("/products/:id", async(req,res)=>res.json(await Product.findByIdAndUpdate(req.params.id,req.body,{new:true})));
app.delete("/products/:id", async(req,res)=>{await Product.findByIdAndDelete(req.params.id);res.json({message:"Product deleted"});});

app.get("/categories", async(req,res)=>res.json(await Product.distinct("category")));

app.get("/cart/:userId", async(req,res)=>{
  const rows=await Cart.find({userId:req.params.userId});
  const result=[];
  for(const row of rows){
    const p=await Product.findById(row.productId);
    if(p) result.push({...row.toObject(),product:p});
  }
  res.json(result);
});
app.post("/cart", async(req,res)=>res.status(201).json(await Cart.create(req.body)));
app.put("/cart/:id", async(req,res)=>res.json(await Cart.findByIdAndUpdate(req.params.id,req.body,{new:true})));
app.delete("/cart/:id", async(req,res)=>{await Cart.findByIdAndDelete(req.params.id);res.json({message:"Removed"});});

app.get("/wishlist/:userId", async(req,res)=>{
  const rows=await Wishlist.find({userId:req.params.userId});
  const result=[];
  for(const row of rows){ const p=await Product.findById(row.productId); if(p) result.push({...row.toObject(),product:p}); }
  res.json(result);
});
app.post("/wishlist", async(req,res)=>res.status(201).json(await Wishlist.create(req.body)));
app.delete("/wishlist/:id", async(req,res)=>{await Wishlist.findByIdAndDelete(req.params.id);res.json({message:"Removed"});});

app.post("/orders", async(req,res)=>res.status(201).json(await Order.create(req.body)));
app.get("/orders/:userId", async(req,res)=>res.json(await Order.find({userId:req.params.userId}).sort({createdAt:-1})));
app.get("/orders", async(req,res)=>res.json(await Order.find().sort({createdAt:-1})));
app.put("/orders/:id", async(req,res)=>res.json(await Order.findByIdAndUpdate(req.params.id,{status:req.body.status},{new:true})));

app.get("/reviews/:productId", async(req,res)=>res.json(await Review.find({productId:req.params.productId}).sort({createdAt:-1})));
app.post("/reviews", async(req,res)=>res.status(201).json(await Review.create(req.body)));

async function seed(){
  if(await Product.countDocuments()) return;
  await Product.insertMany([
    {name:"Classic Cotton T-Shirt",category:"Men",brand:"Mato",price:799,discount:20,image:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",description:"Comfortable everyday cotton t-shirt.",sizes:["S","M","L","XL"],colors:["Black","White"],rating:4.3},
    {name:"Women Casual Dress",category:"Women",brand:"Mato",price:1499,discount:30,image:"https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600",description:"Stylish casual dress for everyday wear.",sizes:["S","M","L"],colors:["Blue","Pink"],rating:4.5},
    {name:"Running Sneakers",category:"Footwear",brand:"Mato Sport",price:2199,discount:15,image:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",description:"Lightweight sneakers for daily activity.",sizes:["7","8","9","10"],colors:["Red","Black"],rating:4.2},
    {name:"Leather Handbag",category:"Accessories",brand:"Mato",price:1899,discount:25,image:"https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600",description:"Elegant handbag with spacious interior.",sizes:["Free"],colors:["Brown","Black"],rating:4.4}
  ]);
}
mongoose.connection.once("open", seed);

app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));