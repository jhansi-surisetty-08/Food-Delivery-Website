import React, { useEffect, useState } from 'react'
import './List.css'
import axios from 'axios'
import { toast } from 'react-toastify';

const List = ({url}) => {

  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    category: 'Salad',
    price: '',
    stockCount: '',
    inStock: true,
  });

  const fetchList = async () =>{
    const response = await axios.get(`${url}/api/food/list`)
   
    if(response.data.success){
      setList(response.data.data)
    }
    else{
      toast.error("Error")
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${url}/api/category/list`);
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load categories');
    }
  }

  const removeFood = async (foodId) =>{

    try {
      const response = await axios.post(`${url}/api/food/remove`, { id: foodId });
      await fetchList();
      
      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        throw new Error(response.data.message || 'Error occurred while removing food.');
      }
    } catch (error) {
      console.log(error);
      
      // Check if the error has a message and display it in the toast.
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
      toast.error(errorMessage);
    }
    
  }

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditImage(null);
    setEditData({
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      stockCount: item.stockCount ?? 0,
      inStock: Boolean(item.inStock),
    });
  }

  const saveEdit = async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', editData.name);
      formData.append('description', editData.description);
      formData.append('category', editData.category);
      formData.append('price', Number(editData.price));
      formData.append('stockCount', Number(editData.stockCount || 0));
      formData.append('inStock', editData.inStock);
      if (editImage) {
        formData.append('image', editImage);
      }

      const response = await axios.post(`${url}/api/food/update/${editingId}`, formData);
      if (response.data.success) {
        toast.success(response.data.message || 'Food updated');
        setEditingId('');
        setEditImage(null);
        await fetchList();
      } else {
        toast.error(response.data.message || 'Update failed');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Update failed');
    }
  }

  const filteredList = list.filter((item) => {
    const search = query.trim().toLowerCase();
    if (!search) return true;
    return (
      item.name.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search)
    );
  });

  useEffect(()=>{
    fetchList();
    fetchCategories();
  },[])
  return (
    <div className='list add flex-col'>
      <p>All Foods List</p>
      <input
        className='food-search'
        type='text'
        placeholder='Search foods by name, category, description'
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="list-table">
        <div className="list-table-format title">
            <b>Image</b>
            <b>Name</b>
            <b>Category</b>
            <b>Price</b>
            <b>Stock</b>
            <b>Action</b>
        </div>
        {filteredList.map((item,index)=>{
          return(
            <div key={index} className="list-table-format">
              <img src={`${url}/images/`+item.image} alt="" />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>₹{item.price}</p>
              <p>{item.inStock ? `In Stock (${item.stockCount ?? 0})` : 'Out of Stock'}</p>
              <div className='actions'>
                <button type='button' onClick={() => startEdit(item)} className='action-btn'>Edit</button>
                <button type='button' onClick={()=> removeFood(item._id)} className='action-btn delete'>Delete</button>
              </div>
            </div>
          )
        })}
      </div>

      {editingId ? (
        <form className='edit-form' onSubmit={saveEdit}>
          <h4>Edit Food Item</h4>
          <div className='edit-grid'>
            <input
              type='text'
              value={editData.name}
              onChange={(e)=>setEditData(prev=>({...prev,name:e.target.value}))}
              placeholder='Name'
              required
            />
            <input
              type='number'
              value={editData.price}
              onChange={(e)=>setEditData(prev=>({...prev,price:e.target.value}))}
              placeholder='Price'
              required
            />
            <select
              value={editData.category}
              onChange={(e)=>setEditData(prev=>({...prev,category:e.target.value}))}
            >
              {categories.map((category) => (
                <option key={category._id} value={category.name}>{category.name}</option>
              ))}
            </select>
            <input
              type='number'
              value={editData.stockCount}
              onChange={(e)=>setEditData(prev=>({...prev,stockCount:e.target.value}))}
              placeholder='Stock Count'
            />
            <label className='inline-check'>
              <input
                type='checkbox'
                checked={editData.inStock}
                onChange={(e)=>setEditData(prev=>({...prev,inStock:e.target.checked}))}
              />
              <span>In Stock</span>
            </label>
            <input
              type='file'
              accept='image/*'
              onChange={(e)=>setEditImage(e.target.files[0] || null)}
            />
          </div>
          <textarea
            value={editData.description}
            onChange={(e)=>setEditData(prev=>({...prev,description:e.target.value}))}
            rows='4'
            placeholder='Description'
            required
          />
          <div className='edit-actions'>
            <button type='submit' className='action-btn'>Save</button>
            <button type='button' className='action-btn delete' onClick={() => setEditingId('')}>Cancel</button>
          </div>
        </form>
      ) : null}
    </div>
  )
}

export default List