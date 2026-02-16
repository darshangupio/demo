let notes = JSON.parse(localStorage.getItem("notes")) || [];
let filter = "all";
let searchText = "";
let currentPage = 1;
let perPage = 5;

// ADD NOTE
function addNote(){
    let input = document.getElementById("noteInput");
    if(input.value.trim() === "") return;

    notes.push({
        text: input.value,
        completed:false
    });

    input.value="";
    saveAndRender();
}

// SAVE + RENDER
function saveAndRender(){
    localStorage.setItem("notes", JSON.stringify(notes));
    showNotes();
}

// FILTER SET
function setFilter(type){
    filter = type;
    currentPage=1;
    showNotes();
}

// SEARCH
function searchNotes(){
    searchText = document.getElementById("searchInput").value.toLowerCase();
    currentPage=1;
    showNotes();
}

// GET FILTERED NOTES
function getFilteredNotes(){
    return notes.filter(note=>{
        let matchSearch = note.text.toLowerCase().includes(searchText);

        if(filter==="active") return !note.completed && matchSearch;
        if(filter==="completed") return note.completed && matchSearch;

        return matchSearch;
    });
}

// SHOW NOTES (WITH PAGINATION)
function showNotes(){

    let body=document.getElementById("notesBody");
    body.innerHTML="";

    let filtered=getFilteredNotes();

    let start=(currentPage-1)*perPage;
    let pageItems=filtered.slice(start,start+perPage);

    pageItems.forEach((note,index)=>{
        let row=document.createElement("tr");

        row.innerHTML=`
        <td>
            <ol>
                <li>${start+index+1}</li>
            </ol>
        </td>

        <td class="${note.completed?'completed':''}">
            ${note.text}
        </td>

        <td>
            <input type="checkbox" ${note.completed?'checked':''}
            onclick="toggleComplete(${notes.indexOf(note)})">
        </td>

        <td>
            <button onclick="editNote(${notes.indexOf(note)})">Edit</button>
            <button onclick="deleteNote(${notes.indexOf(note)})">Delete</button>
        </td>
        `;

        body.appendChild(row);
    });

    document.getElementById("pageInfo").innerText=
        `Page ${currentPage} / ${Math.ceil(filtered.length/perPage)||1}`;
}

// COMPLETE
function toggleComplete(index){
    notes[index].completed=!notes[index].completed;
    saveAndRender();
}

// DELETE
function deleteNote(index){
    notes.splice(index,1);
    saveAndRender();
}

// EDIT
function editNote(index){
    let newText=prompt("Edit note:",notes[index].text);
    if(newText) notes[index].text=newText;
    saveAndRender();
}

// PAGINATION
function nextPage(){
    let total=Math.ceil(getFilteredNotes().length/perPage);
    if(currentPage<total){
        currentPage++;
        showNotes();
    }
}

function prevPage(){
    if(currentPage>1){
        currentPage--;
        showNotes();
    }
}

// FIRST LOAD
showNotes();
