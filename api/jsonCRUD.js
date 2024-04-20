import fs, { write } from 'fs';

function readJSONFile(filePath) {
    try{
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch(error){
        console.error("Error reading JSON file: ", error);
        return null;
    }
}

function writeToJSONFile(filePath, newJSON){
        fs.writeFile(filePath, JSON.stringify(newJSON), err=>{
            if(err){
                console.error("Error writing JSON file: " , err);
            } else {
                console.log('JSON data updated successfully');
            }
        })
}

const chatTemplateFilePath = './json_data/chatTemplate.json';

const chatTemplate = {
    data: {},
    updateData(){
        this.data = readJSONFile(chatTemplateFilePath)
        return this.data;
    },
    updateTemplate(id, template, variables){
        this.updateData();

        const updatedTemplate = {
            id: id,
            template,
            variables
        }

        this.data.templates = this.data.templates.map(template=>{
            return template.id === updatedTemplate.id ? this.updatedTemplate : template; 
        }) 
    },
    addTemplate(template, variables){
        this.updateData();

        const newTemplate = {
            id: this.data.next_id++,
            template,
            variables
        }

        this.data.templates.push(newTemplate);

        writeToJSONFile(chatTemplateFilePath, this.data);

        return this.data; 
    }
}

export {chatTemplate}
