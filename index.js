
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.set('view engine', 'ejs');

// Session configuration
app.use(session({
  secret: 'portfolio-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// MongoDB connection
mongoose.connect('mongodb://dfdfd_climbaskme:d291d56b4ef1b1fc0b6867bdc76484e2276940eb@tv3k1.h.filess.io:27017/dfdfd_climbaskme', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

// Database Models
const adminSchema = new mongoose.Schema({
  username: String,
  password: String
});

const heroSchema = new mongoose.Schema({
  title: String,
  subtitles: [String],
  description: String,
  image: String,
  resumeLink: String
});

const expertiseSchema = new mongoose.Schema({
  title: String,
  description: String,
  descriptionPoints: [String],
  icon: String,
  link: String
});

const skillSchema = new mongoose.Schema({
  name: String,
  percentage: Number,
  category: String,
  icon: String
});

const educationSchema = new mongoose.Schema({
  degree: String,
  institution: String,
  year: String,
  description: String,
  link: String
});

const workSchema = new mongoose.Schema({
  title: String,
  category: String,
  image: String,
  description: String,
  link: String
});

const serviceSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  features: [String],
  icon: String
});

const testimonialSchema = new mongoose.Schema({
  name: String,
  position: String,
  company: String,
  message: String,
  image: String,
  rating: Number
});

const blogSchema = new mongoose.Schema({
  title: String,
  excerpt: String,
  content: String,
  image: String,
  author: String,
  date: { type: Date, default: Date.now },
  category: String
});

const headerSchema = new mongoose.Schema({
  logo: String,
  logoText: String,
  navigationItems: [{
    name: String,
    link: String
  }]
});

const footerSchema = new mongoose.Schema({
  aboutText: String,
  contactEmail: String,
  contactPhone: String,
  contactAddress: String,
  mapEmbedUrl: String,
  socialLinks: [{
    platform: String,
    url: String,
    icon: String
  }],
  quickLinks: [{
    name: String,
    url: String
  }],
  privacyPolicyContent: String
});

const orderSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  message: String,
  status: { type: String, default: 'pending' }, // pending, processing, completed, cancelled
  paymentStatus: { type: String, default: 'pending' }, // pending, paid, failed
  paypalOrderId: String,
  amount: Number,
  createdAt: { type: Date, default: Date.now }
});

const adminSettingsSchema = new mongoose.Schema({
  username: String,
  email: String,
  paypalClientId: String,
  paypalClientSecret: String,
  paypalSandbox: { type: Boolean, default: true }
});

const Admin = mongoose.model('Admin', adminSchema);
const Hero = mongoose.model('Hero', heroSchema);
const Expertise = mongoose.model('Expertise', expertiseSchema);
const Skill = mongoose.model('Skill', skillSchema);
const Education = mongoose.model('Education', educationSchema);
const Work = mongoose.model('Work', workSchema);
const Service = mongoose.model('Service', serviceSchema);
const Testimonial = mongoose.model('Testimonial', testimonialSchema);
const Blog = mongoose.model('Blog', blogSchema);
const Header = mongoose.model('Header', headerSchema);
const Footer = mongoose.model('Footer', footerSchema);
const Order = mongoose.model('Order', orderSchema);
const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect('/admin/login');
  }
};

// Initialize admin user
const initAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('aass1122', 10);
      const admin = new Admin({
        username: 'admin',
        password: hashedPassword
      });
      await admin.save();
      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Routes
// Frontend Routes
app.get('/', async (req, res) => {
  try {
    const hero = await Hero.findOne();
    const expertise = await Expertise.find();
    const skills = await Skill.find();
    const education = await Education.find();
    const works = await Work.find();
    const services = await Service.find();
    const testimonials = await Testimonial.find();
    const blogs = await Blog.find().sort({ date: -1 }).limit(3);
    const header = await Header.findOne();
    const footer = await Footer.findOne();

    res.render('index', {
      hero,
      expertise,
      skills,
      education,
      works,
      services,
      testimonials,
      blogs,
      header,
      footer
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Admin Routes
app.get('/admin/login', (req, res) => {
  res.render('admin/login');
});

app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    
    if (admin && await bcrypt.compare(password, admin.password)) {
      req.session.admin = true;
      res.redirect('/admin/dashboard');
    } else {
      res.render('admin/login', { error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.get('/admin/dashboard', requireAuth, async (req, res) => {
  try {
    const stats = {
      expertise: await Expertise.countDocuments(),
      skills: await Skill.countDocuments(),
      education: await Education.countDocuments(),
      works: await Work.countDocuments(),
      services: await Service.countDocuments(),
      testimonials: await Testimonial.countDocuments(),
      blogs: await Blog.countDocuments()
    };
    res.render('admin/dashboard', { stats });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Hero Section Management
app.get('/admin/hero', requireAuth, async (req, res) => {
  const hero = await Hero.findOne();
  res.render('admin/hero', { hero });
});

app.post('/admin/hero', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const heroData = {
      title: req.body.title,
      subtitles: Array.isArray(req.body.subtitles) ? req.body.subtitles.filter(s => s.trim()) : [req.body.subtitles].filter(s => s && s.trim()),
      description: req.body.description,
      resumeLink: req.body.resumeLink
    };
    
    if (req.file) {
      heroData.image = req.file.filename;
    }

    await Hero.findOneAndUpdate({}, heroData, { upsert: true });
    res.redirect('/admin/hero');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Expertise Management
app.get('/admin/expertise', requireAuth, async (req, res) => {
  const expertise = await Expertise.find();
  res.render('admin/expertise', { expertise });
});

app.post('/admin/expertise', requireAuth, async (req, res) => {
  try {
    const expertiseData = req.body;
    if (expertiseData.descriptionPoints) {
      expertiseData.descriptionPoints = Array.isArray(expertiseData.descriptionPoints) 
        ? expertiseData.descriptionPoints.filter(point => point.trim()) 
        : [expertiseData.descriptionPoints].filter(point => point && point.trim());
    }
    const expertise = new Expertise(expertiseData);
    await expertise.save();
    res.redirect('/admin/expertise');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.post('/admin/expertise/delete/:id', requireAuth, async (req, res) => {
  await Expertise.findByIdAndDelete(req.params.id);
  res.redirect('/admin/expertise');
});

app.post('/admin/expertise/edit/:id', requireAuth, async (req, res) => {
  try {
    const expertiseData = req.body;
    if (expertiseData.descriptionPoints) {
      expertiseData.descriptionPoints = Array.isArray(expertiseData.descriptionPoints) 
        ? expertiseData.descriptionPoints.filter(point => point.trim()) 
        : [expertiseData.descriptionPoints].filter(point => point && point.trim());
    }
    await Expertise.findByIdAndUpdate(req.params.id, expertiseData);
    res.redirect('/admin/expertise');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Skills Management
app.get('/admin/skills', requireAuth, async (req, res) => {
  const skills = await Skill.find();
  res.render('admin/skills', { skills });
});

app.post('/admin/skills', requireAuth, async (req, res) => {
  try {
    const skill = new Skill(req.body);
    await skill.save();
    res.redirect('/admin/skills');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.post('/admin/skills/delete/:id', requireAuth, async (req, res) => {
  await Skill.findByIdAndDelete(req.params.id);
  res.redirect('/admin/skills');
});

// Education Management
app.get('/admin/education', requireAuth, async (req, res) => {
  const education = await Education.find();
  res.render('admin/education', { education });
});

app.post('/admin/education', requireAuth, async (req, res) => {
  try {
    const education = new Education(req.body);
    await education.save();
    res.redirect('/admin/education');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.post('/admin/education/delete/:id', requireAuth, async (req, res) => {
  await Education.findByIdAndDelete(req.params.id);
  res.redirect('/admin/education');
});

app.post('/admin/education/edit/:id', requireAuth, async (req, res) => {
  try {
    await Education.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/admin/education');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Works Management
app.get('/admin/works', requireAuth, async (req, res) => {
  const works = await Work.find();
  res.render('admin/works', { works });
});

app.post('/admin/works', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const workData = req.body;
    if (req.file) {
      workData.image = req.file.filename;
    }
    const work = new Work(workData);
    await work.save();
    res.redirect('/admin/works');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.post('/admin/works/delete/:id', requireAuth, async (req, res) => {
  await Work.findByIdAndDelete(req.params.id);
  res.redirect('/admin/works');
});

app.post('/admin/works/edit/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const workData = req.body;
    if (req.file) {
      workData.image = req.file.filename;
    }
    await Work.findByIdAndUpdate(req.params.id, workData);
    res.redirect('/admin/works');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Services Management
app.get('/admin/services', requireAuth, async (req, res) => {
  const services = await Service.find();
  res.render('admin/services', { services });
});

app.post('/admin/services', requireAuth, async (req, res) => {
  try {
    const serviceData = req.body;
    serviceData.features = req.body.features.split(',').map(f => f.trim());
    const service = new Service(serviceData);
    await service.save();
    res.redirect('/admin/services');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.post('/admin/services/delete/:id', requireAuth, async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  res.redirect('/admin/services');
});

// Testimonials Management
app.get('/admin/testimonials', requireAuth, async (req, res) => {
  const testimonials = await Testimonial.find();
  res.render('admin/testimonials', { testimonials });
});

app.post('/admin/testimonials', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const testimonialData = req.body;
    if (req.file) {
      testimonialData.image = req.file.filename;
    }
    const testimonial = new Testimonial(testimonialData);
    await testimonial.save();
    res.redirect('/admin/testimonials');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.post('/admin/testimonials/delete/:id', requireAuth, async (req, res) => {
  await Testimonial.findByIdAndDelete(req.params.id);
  res.redirect('/admin/testimonials');
});

// Blog Management
app.get('/admin/blogs', requireAuth, async (req, res) => {
  const blogs = await Blog.find().sort({ date: -1 });
  res.render('admin/blogs', { blogs });
});

app.post('/admin/blogs', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const blogData = req.body;
    if (req.file) {
      blogData.image = req.file.filename;
    }
    const blog = new Blog(blogData);
    await blog.save();
    res.redirect('/admin/blogs');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.post('/admin/blogs/delete/:id', requireAuth, async (req, res) => {
  await Blog.findByIdAndDelete(req.params.id);
  res.redirect('/admin/blogs');
});

// Header Management
app.get('/admin/header', requireAuth, async (req, res) => {
  const header = await Header.findOne();
  res.render('admin/header', { header });
});

app.post('/admin/header', requireAuth, upload.single('logo'), async (req, res) => {
  try {
    const headerData = {
      logoText: req.body.logoText,
      navigationItems: []
    };
    
    if (req.file) {
      headerData.logo = req.file.filename;
    }

    // Process navigation items
    if (req.body.navNames && req.body.navLinks) {
      const navNames = Array.isArray(req.body.navNames) ? req.body.navNames : [req.body.navNames];
      const navLinks = Array.isArray(req.body.navLinks) ? req.body.navLinks : [req.body.navLinks];
      
      for (let i = 0; i < navNames.length; i++) {
        if (navNames[i] && navLinks[i]) {
          headerData.navigationItems.push({
            name: navNames[i],
            link: navLinks[i]
          });
        }
      }
    }

    await Header.findOneAndUpdate({}, headerData, { upsert: true });
    res.redirect('/admin/header');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Footer Management
app.get('/admin/footer', requireAuth, async (req, res) => {
  const footer = await Footer.findOne();
  res.render('admin/footer', { footer });
});

app.post('/admin/footer', requireAuth, async (req, res) => {
  try {
    const footerData = {
      aboutText: req.body.aboutText,
      contactEmail: req.body.contactEmail,
      contactPhone: req.body.contactPhone,
      contactAddress: req.body.contactAddress,
      mapEmbedUrl: req.body.mapEmbedUrl,
      privacyPolicyContent: req.body.privacyPolicyContent,
      socialLinks: [],
      quickLinks: []
    };

    // Process social links
    if (req.body.socialPlatforms && req.body.socialUrls && req.body.socialIcons) {
      const platforms = Array.isArray(req.body.socialPlatforms) ? req.body.socialPlatforms : [req.body.socialPlatforms];
      const urls = Array.isArray(req.body.socialUrls) ? req.body.socialUrls : [req.body.socialUrls];
      const icons = Array.isArray(req.body.socialIcons) ? req.body.socialIcons : [req.body.socialIcons];
      
      for (let i = 0; i < platforms.length; i++) {
        if (platforms[i] && urls[i] && icons[i]) {
          footerData.socialLinks.push({
            platform: platforms[i],
            url: urls[i],
            icon: icons[i]
          });
        }
      }
    }

    // Process quick links
    if (req.body.quickLinkNames && req.body.quickLinkUrls) {
      const names = Array.isArray(req.body.quickLinkNames) ? req.body.quickLinkNames : [req.body.quickLinkNames];
      const urls = Array.isArray(req.body.quickLinkUrls) ? req.body.quickLinkUrls : [req.body.quickLinkUrls];
      
      for (let i = 0; i < names.length; i++) {
        if (names[i] && urls[i]) {
          footerData.quickLinks.push({
            name: names[i],
            url: urls[i]
          });
        }
      }
    }

    await Footer.findOneAndUpdate({}, footerData, { upsert: true });
    res.redirect('/admin/footer');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Privacy Policy Route
app.get('/privacy-policy', async (req, res) => {
  try {
    const footer = await Footer.findOne();
    const header = await Header.findOne();
    res.render('privacy-policy', { footer, header });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Service Order Route
app.post('/order-service', async (req, res) => {
  try {
    const { serviceId, customerName, customerEmail, customerPhone, message } = req.body;
    const service = await Service.findById(serviceId);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const order = new Order({
      serviceId,
      customerName,
      customerEmail,
      customerPhone,
      message,
      amount: service.price
    });

    await order.save();
    res.json({ success: true, orderId: order._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Orders Management
app.get('/admin/orders', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find().populate('serviceId').sort({ createdAt: -1 });
    res.render('admin/orders', { orders });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.post('/admin/orders/update-status/:id', requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { status });
    res.redirect('/admin/orders');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Admin Settings
app.get('/admin/settings', requireAuth, async (req, res) => {
  try {
    const settings = await AdminSettings.findOne();
    const admin = await Admin.findOne({ username: 'admin' });
    res.render('admin/settings', { settings, admin });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.post('/admin/settings', requireAuth, async (req, res) => {
  try {
    const { email, paypalClientId, paypalClientSecret, paypalSandbox } = req.body;
    
    await AdminSettings.findOneAndUpdate({}, {
      email,
      paypalClientId,
      paypalClientSecret,
      paypalSandbox: paypalSandbox === 'on'
    }, { upsert: true });

    res.redirect('/admin/settings');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.post('/admin/change-credentials', requireAuth, async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    const admin = await Admin.findOne({ username: 'admin' });
    if (!admin) {
      return res.status(404).send('Admin not found');
    }

    const updateData = { username, email };
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await Admin.findByIdAndUpdate(admin._id, updateData);
    
    // Update session if username changed
    if (username !== 'admin') {
      req.session.destroy();
      return res.redirect('/admin/login');
    }

    res.redirect('/admin/settings');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  initAdmin();
});
