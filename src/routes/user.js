const express     = require('express');
const router      =  new express.Router()
const User        = require('../models/user')
const {ObjectID}  = require('mongodb')


const authenticate  = require('../middleware/auth')

router.get('/', (req, res) => {
    res.render('index', {page:'Home', menuId:'home' });

});


router.post('/register',async (req,res) => {
    const user = new User(req.body);
    try{
        const token = await user.newAuthToken()
        res.status(201).send({user, token})
    }catch(e){
        res.status(400).send(e)
    }
})

router.get('/users/me', authenticate,async (req,res)=> {
    res.render('welcome', {page:'Welcome', menuId:'welcome',user:req.user});
})


router.patch('/users/me',authenticate ,async (req,res) => {
    const updates  = Object.keys(req.body)
    const allowedUpdates = ["name", "email", "password", "phone"]
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    const _id =  req.user._id

    if(!isValidOperation){
        res.status(400).send({error:'Invalid request'})
    }

    if (!ObjectID.isValid(_id)) {
        return res.status(404).send();
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user);
    } catch (error) {
        res.status(400).send()
    }

})

router.delete('/users/me', authenticate, async (req,res) => {

    if (!ObjectID.isValid(req.user._id)) {
        return res.status(404).send();
    }

    try {
        await req.user.remove()
        res.send(req.user)
    } catch (error) {
        res.status(500).send()
    }
})

router.post('/users/login', async (req, res) => {
    try {

        const user  = await User.checkValidCredentials(req.body.email, req.body.password)
       // console.log(user);
       // res.send(user);
        const token = await user.newAuthToken()

        res.cookie('token', token, { httpOnly: true })
        res.send({ user, token})
    } catch (error) {
        res.status(400).send()
    }
})

router.get('/users/logout', authenticate, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) =>{
            return token.token !== req.token
        })
        await req.user.save()
        res.clearCookie("token");
        res.redirect('/')
    } catch (error) {
        res.status(500).send()
    }
})


router.post('/users/logoutall', authenticate, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (error) {
        res.status(500).send()
    }
})


module.exports = router