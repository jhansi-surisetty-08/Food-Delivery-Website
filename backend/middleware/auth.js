import  jwt  from 'jsonwebtoken';

const getRequestToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
    }

    return req.headers.token;
}

const authMiddleware = async (req, res, next) =>{
    const token = getRequestToken(req);
    if(!token){
        return res.status(401).json({success:false, message:'Not Authorized, login again'})
    }

    try {
        const token_decode = jwt.verify(token,process.env.JWT_SECRET);
        req.body.userId = token_decode.id;
        req.user = token_decode;
        next();
    } catch (error) {
        console.log(error)
        res.status(401).json({success:false, message:'Session expired. Please login again.'})
    }
}

export default authMiddleware;
