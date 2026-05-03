import axios from 'axios'
export const API = axios.create({ baseURL: 'http://localhost:8000/api' })
export async function listPages(){ const {data}=await API.get('/pages'); return data }
export async function getPage(id:string){ const {data}=await API.get('/pages/'+id); return data }
export async function savePage(payload:any){ const {data}=await API.post('/pages', payload); return data }
export async function deletePage(id:string){ const {data}=await API.delete('/pages/'+id); return data }
