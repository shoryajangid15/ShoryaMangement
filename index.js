require("dotenv").config();
const app = require("./src/app");

const PORT = process.env.PORT || 27017;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});