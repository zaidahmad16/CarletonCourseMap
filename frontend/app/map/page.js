'use client'

import { useState,useEffect } from "react"

const API = 'https://carletoncoursemap.ca'

export default function MapPage() {
    const [departments,setDepartments] = useState([])
    const [selectedDept,setSelectedDept]=useState([null])
    const [programs,setPrograms]=useState([])
    const [selectedPrograms,setSelectedProgram]=useState(null)


    //Fetch departments on load
    useEffect(()=>{
        fetch('${API}/departments')
            .then(r=>r.json())
            .then(setDepartments)
    },[])


    // Fetch programs when departments changes
    useEffect(()=>{
    if (!selectedDept) return
    fetch('${API}/programs?dept=${selectedDept}')
        .then(r=>r.json())
        .then(setPrograms)
    }   ,[selectedDept])

    return(
        <div style={{ padding: 20 }}>
        <h1>CarletonCourseMap</h1>

        <select onChange={e => setSelectedDept(e.target.value)} defaultValue="">
            <option value="" disabled>Select a department</option>
            {departments.map(d => (
            <option key={d.dept_id} value={d.dept_id}>{d.name}</option>
            ))}
        </select>

        {programs.length > 0 && (
            <select onChange={e => setSelectedProgram(e.target.value)} defaultValue="">
            <option value="" disabled>Select a program</option>
            {programs.map(p => (
                <option key={p.program_id} value={p.program_id}>{p.degree}</option>
            ))}
            </select>
        )}
        </div>
    )


}




