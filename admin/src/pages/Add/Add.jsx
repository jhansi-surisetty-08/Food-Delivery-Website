import React, {useEffect, useState } from 'react'
import './Add.css'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const Add = ({url}) => {

    const [image, setImage] = useState(false);
    const [categories, setCategories] = useState([]);
    const [data, setData] = useState({
        name:'',
        description:'',
        price:'',
        category:'',
        inStock:true,
        stockCount:''
    })

    const loadCategories = async () => {
        try {
            const response = await axios.get(`${url}/api/category/list`);
            if (response.data.success) {
                setCategories(response.data.data);
                if (!data.category && response.data.data.length) {
                    setData(prev => ({ ...prev, category: response.data.data[0].name }));
                }
            }
        } catch (error) {
            toast.error('Failed to load categories');
        }
    }

    const onChangeHandler = (event) =>{
        const name = event.target.name;
        const value = event.target.value;
        setData(data=>({...data,[name]:value}))
    }

    const onSubmitHandler = async (event) =>{
        event.preventDefault();
        const formData = new FormData();
        formData.append('name', data.name)
        formData.append('description', data.description)
        formData.append('price', Number(data.price))
        formData.append('category', data.category)
        formData.append('inStock', data.inStock)
        formData.append('stockCount', Number(data.stockCount || 0))
        formData.append('image', image)
        const response = await axios.post(`${url}/api/food/add`, formData);

        if(response.data.success){
            setData({
                name:'',
                description:'',
                price:'',
                category: categories[0]?.name || '',
                inStock:true,
                stockCount:''
            })
            setImage(false);
            toast.success(response.data.message)
        }else{
            toast.error(response.data.message)
        }
    }

    useEffect(() => {
        loadCategories();
    }, []);

  return (
    <div className='add'>
        <form  className="flex-col" onSubmit={onSubmitHandler}>
            <div className="add-img-upload flex-col">
                <p>Upload Image</p>
                <label htmlFor="image">
                    <img src={image? URL.createObjectURL(image):assets.upload_area} alt="" />
                </label>
                <input onChange={(e)=>setImage(e.target.files[0])} type="file" id='image' hidden required />
            </div>
            <div className="add-product-name flex-col">
                <p>Product name</p>
                <input onChange={onChangeHandler} value={data.name} type="text" name='name' placeholder='Type Here' />
            </div>
            <div className="add-product-description flex-col">
                <p>Product description</p>
                <textarea onChange={onChangeHandler} value={data.description} name="description" rows='6' placeholder='Write content here' required></textarea>
            </div>
            <div className="add-category-price">
                <div className="add-category flex-col">
                    <p>Product category</p>
                    <select onChange={onChangeHandler}  name="category">
                                                {categories.map((category) => (
                                                    <option key={category._id} value={category.name}>{category.name}</option>
                                                ))}
                    </select>
                </div>
                <div className="add-price flex-col">
                    <p>Product price</p>
                    <input onChange={onChangeHandler} value={data.price} type="number" name='price' placeholder='₹1000'/>
                </div>
                <div className="add-price flex-col">
                    <p>Stock Count</p>
                    <input onChange={onChangeHandler} value={data.stockCount} type="number" name='stockCount' placeholder='0'/>
                </div>
                <div className="add-stock-toggle flex-col">
                    <p>Availability</p>
                    <label className="stock-switch">
                        <input
                          type="checkbox"
                          checked={Boolean(data.inStock)}
                          onChange={(e)=>setData(prev=>({...prev,inStock:e.target.checked}))}
                        />
                        <span>{data.inStock ? 'In Stock' : 'Out of Stock'}</span>
                    </label>
                </div>
            </div>
            <button type='submit' className='add-btn'>ADD</button>
        </form>
    </div>
  )
}

export default Add