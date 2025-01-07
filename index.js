const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");

const app = express();


// Set up EJS
app.set("view engine", "ejs");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Connect to MongoDB
mongoose
    .connect("mongodb+srv://user_12:Momloveu12.@cluster0.i4s3y.mongodb.net/todolistDB?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Error connecting to MongoDB:", err));

// Define Schemas
const itemsSchema = {
    name: {
        type: String,
        required: true,
    },
};

const listSchema = {
    name: String,
    items: [itemsSchema],
};

// Define Models
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

// Default Items
const defaultItems = [
    new Item({ name: "Welcome to your to-do list!" }),
    new Item({ name: "Hit the + button to add a new item." }),
    new Item({ name: "<-- Hit this to delete an item." }),
];

// Save Default Items
async function saveDefaultItems() {
    try {
        const existingItems = await Item.find({});
        if (existingItems.length === 0) {
            await Item.insertMany(defaultItems);
            console.log("Default items added to the database.");
        }
    } catch (err) {
        console.error("Error saving default items:", err);
    }
}
saveDefaultItems();

// Home Route
app.get("/", async (req, res) => {
    try {
        const foundItems = await Item.find({});
        res.render("list", { listTitle: "Today", newListitems: foundItems });
    } catch (err) {
        console.error("Error fetching items:", err);
        res.status(500).send("An error occurred while fetching items.");
    }
});

// Custom List Route
app.get("/:customListName", async (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    try {
        const foundList = await List.findOne({ name: customListName });
        if (!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems,
            });
            await list.save();
            res.redirect(`/${customListName}`);
        } else {
            res.render("list", { listTitle: foundList.name, newListitems: foundList.items });
        }
    } catch (err) {
        console.error("Error processing custom list:", err);
        res.status(500).send("An error occurred while processing your request.");
    }
});

// Add New Item
app.post("/", async (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    try {
        const newItem = new Item({ name: itemName });
        if (listName === "Today") {
            await newItem.save();
            res.redirect("/");
        } else {
            const foundList = await List.findOne({ name: listName });
            foundList.items.push(newItem);
            await foundList.save();
            res.redirect(`/${listName}`);
        }
    } catch (err) {
        console.error("Error adding new item:", err);
        res.status(500).send("An error occurred while adding the item.");
    }
});

// Delete Item
app.post("/delete", async (req, res) => {
    const itemId = req.body.checkbox;
    const listName = req.body.listName;

    try {
        if (listName === "Today") {
            await Item.findByIdAndDelete(itemId);
            res.redirect("/");
        } else {
            await List.findOneAndUpdate(
                { name: listName },
                { $pull: { items: { _id: itemId } } }
            );
            res.redirect(`/${listName}`);
        }
    } catch (err) {
        console.error("Error deleting item:", err);
        res.status(500).send("An error occurred while deleting the item.");
    }
});

// Optional Work Route
app.get("/work", async (req, res) => {
    try {
        const foundItems = await Item.find({});
        res.render("list", { listTitle: "Work List", newListitems: foundItems });
    } catch (err) {
        console.error("Error fetching work items:", err);
        res.status(500).send("An error occurred while fetching work items.");
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
