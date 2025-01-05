const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const _ = require("lodash");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Connect to MongoDB
mongoose
    .connect("mongodb+srv://user_12:Momloveu12.@cluster0.i4s3y.mongodb.net/todolistDB?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Error connecting to MongoDB:", err));

// Define Schema and Model
const itemsSchema = {
    name: {
        type: String,
        required: true,
    },
};

const Item = mongoose.model("Item", itemsSchema);

// Default Items
const item1 = new Item({ name: "Welcome to your to-do list!" });
const item2 = new Item({ name: "Hit the + button to add a new item." });
const item3 = new Item({ name: "<-- Hit this to delete an item." });

const defaultItems = [item1, item2, item3];
const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)
// Save Default Items to DB
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

// Routes
// Home Route
app.get("/", async function (req, res) {
    try {
        const foundItems = await Item.find({});
        res.render("list", { listTitle: "Today", newListitems: foundItems });
    } catch (err) {
        console.error("Error fetching items:", err);
        res.status(500).send("An error occurred while fetching items.");
    }
});


app.get("/:customListName", async function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    try {
        // Check if the list already exists
        const foundList = await List.findOne({ name: customListName });

        if (!foundList) {
            // If the list doesn't exist, create a new one
            const list = new List({
                name: customListName,
                items: defaultItems,
            });

            await list.save();
            console.log(`New list "${customListName}" created.`);
            res.redirect(`/${customListName}`); // Redirect to the new list
        } else {
            // If the list exists, render it
            res.render("list", { listTitle: foundList.name, newListitems: foundList.items });
        }
    } catch (err) {
        console.error("Error creating or fetching custom list:", err);
        res.status(500).send("An error occurred while processing your request.");
    }
});

// Add New Item
app.post("/", async function (req, res) {
    try {
        const itemName = req.body.newItem;
        const listName = req.body.list;
        const newItem = new Item({ name: itemName });

        if (listName === "Today") {
            await newItem.save();
            res.redirect("/");
        } else {
            const foundList = await List.findOne({ name: listName });
            foundList.items.push(newItem);
            await foundList.save();
            res.redirect("/" + listName);
        }
    } catch (err) {
        console.error("Error adding new item:", err);
        res.status(500).send("An error occurred while adding the item.");
    }
});

// Work Route (Optional Separate List)
app.get("/work", async function (req, res) {
    try {
        const foundItems = await Item.find({});
        res.render("list", { listTitle: "Work List", newListitems: foundItems });
    } catch (err) {
        console.error("Error fetching work items:", err);
        res.status(500).send("An error occurred while fetching work items.");
    }
});

// Delete Item Route
app.post("/delete", async function (req, res) {
    try {
        const itemId = req.body.checkbox; // ID of the item to be deleted
        const listName = req.body.listName; // Name of the list (e.g., "Today" or a custom list)

        if (listName === "Today") {
            // Delete from the "Today" list
            await Item.findByIdAndDelete(itemId);
            console.log(`Item with ID "${itemId}" deleted successfully from "Today" list.`);
            res.redirect("/");
        } else {
            // Delete from a custom list
            await List.findOneAndUpdate(
                { name: listName },
                { $pull: { items: { _id: itemId } } } // Remove item from the array
            );
            console.log(`Item with ID "${itemId}" deleted successfully from list "${listName}".`);
            res.redirect("/" + listName);
        }
    } catch (err) {
        console.error("Error deleting item:", err);
        res.status(500).send("An error occurred while deleting the item.");
    }
});

// Start Server
app.listen(process.env.port || 3000, () => {
    console.log("Server started on port 3000");
});
