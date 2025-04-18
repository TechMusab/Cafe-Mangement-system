const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3004;

app.use(express.json());

// MongoDB connection
const connectMongo = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      await mongoose.connect('mongodb://mongodb:27017/cafe');
      console.log('Inventory Service connected to MongoDB');
      break;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};
/*
/*i have cafe managemnt system in which these services includes
customer-services inventroy services menu services
order services payment services
i have tasked with evluting a node.js microservices based cafe management sytem which suportd a customer emma who use cafe. she navigwates to appp to browse the menu check her loyalty points and other services.
Cafe management system consist of 6 microservices
1.Api gateway running on http://localhost:3000 serves as central entry point efficantly routng the app to apporprate microsrvices
2.Menu service manges the cafe menu storing items in mongodb with details like itemid, name price and stock it respponds to get requests http://localhost:3000/menu 
3.Order service is core handling Emma POST request http://localhost:3000/orders with selections(latte:1,muffin:1). It vallidates items by querying the menu service check emma customer id with customer serivce calculates the total and stores the order in mongodb it then updates stock by sending the post request to http://localhost:3000/inventory/update and awards loyalyy points
via http://localhost:3000/customers/update-points 
4.The inventory service maintains stock level in mongodb resppondign to order service update requst by reducing quanatites and verifying sufficient stock 
5.The Custmer sservice manages emma profile storing id name email loyality points in mongodb. ti handles get requests to display cureent points and post reuqest to add points incentivizing her retuen visits with rewars like free coffee at 20 points 
  6.payment service process emma payment thoriugh post requst http://localhost:3000/payments verifying the total matches the ordr by querying the roder service recoding the transcion to mongodb
  github repo: https://github.com/zoya532/Lab_Sessional.git
  implementation steps:
to run this follow structed workflow inolcing steup canternizaton and continous integratioin:
1.Install all the necessary dependencies and libraries for each microservice. This involves navigating to each directory and ensuring all the requeird nodejs packages are correctly installed 
2. Conternize each microservice using a Dockerfile each dockerfile should define envoirnment setup inclding base image working dir dependency installtion source code copying and service startup 
3.implement the CI/CD automation using github actions this includes creating workflow fils that automaticaly build dokcer images for each servce whenever changes are pushed to main branch. it should handle steps such as checking out the code setting up the build envoinment logging in docker hub  builfing the images and pushing them to registry before implementing you have to generate tour own github repo  and push the code
finally sytem should start and run either locally or contairnized envoirnemnet
 */
connectMongo().catch(console.error);

// Menu Item Schema
const menuItemSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: String,
  price: Number,
  stock: Number,
});

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

app.get('/inventory', async (req, res) => {
  const items = await MenuItem.find();
  res.json(items.map(i => ({ id: i.id, name: i.name, stock: i.stock })));
});

app.post('/inventory/update', async (req, res) => {
  const { items } = req.body; // items: [{ menuItemId, quantity }]
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Invalid items' });
  }

  try {
    for (const item of items) {
      const menuItem = await MenuItem.findOne({ id: item.menuItemId });
      if (!menuItem) {
        return res.status(400).json({ error: `Menu item ${item.menuItemId} not found` });
      }
      if (menuItem.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${menuItem.name}` });
      }
      menuItem.stock -= item.quantity;
      await menuItem.save();
      console.log(`Updated stock for ${menuItem.name}: ${menuItem.stock}`);
    }
    res.status(200).json({ message: 'Inventory updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

app.listen(port, () => {
  console.log(`Inventory Service running on port ${port}`);
});