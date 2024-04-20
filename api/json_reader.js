import { chatTemplate } from "./jsonCRUD.js";


let data = chatTemplate.updateData();

chatTemplate.addTemplate("Hello [name]", ["_name_"])

console.log({data})