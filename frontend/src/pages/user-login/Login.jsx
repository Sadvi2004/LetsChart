import React, { useState, useNavigation } from 'react'
import useLoginStore from '../../store/useLoginStore'
import useUserStore from '../../store/useUserStore'
import countries from '../../utils/countries';
import * as yup from 'yup';
import { yupResolver } from "@hookform/resolvers/yup"
import { useForm, Watch } from 'react-hook-form';

//validation schema
const loginValidationSchema = yup
    .object()
    .shape({
        phoneNumber: yup.string().nullable().notRequired().matches(/^\d+$/, "Phone number must be digit").transform((value, originalValue) => {
            originalValue.trim() === "" ? null : value
        }),
        email: yup.string().nullable().notRequired().email("please enter valid email").transform((value, originalValue) => {
            originalValue.trim() === "" ? null : value
        })
    }).test(
        "at-least-one",
        "Either email or phone number is required",
        function (value) {
            return !!(value.phoneNumber || value.email)
        }
    );

const otpValidationSchema = yup.object().shape({
    otp: yup.string().length(6, "Otp must be exactly 6 digits").required("Otp is required")
});
const profileValidationSchema = yup.object().shape({
    username: yup.string().required("Username is required"),
    agreed: yup.bool().oneOf([true], "You must agree to the terms")
});
const avatars = [
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe',
]


const Login = () => {
    const { step, setStep, setUserPhoneData, userPhoneData, resetLoginData } = useLoginStore();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [selectedCountry, setSelectedCountry] = useState(countries[0]);;
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [email, setEmail] = useState("");
    const [profilePicture, setProfilePicture] = useState(null);
    const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigation();
    const { setUser } = useUserStore();

    const {
        register: loginRegister,
        handleSubmit: handleLoginSubmit,
        formState: { errors: loginErrors }
    } = useForm({
        resolver: yupResolver(loginValidationSchema)
    })

    const {
        handleSubmit: handleOtpSubmit,
        formState: { errors: otpErrors },
        setValue: setOtpValue
    } = useForm({
        resolver: yupResolver(otpValidationSchema)
    })

    const {
        register: profileRegister,
        handleSubmit: handleProfileSubmit,
        formState: { errors: profileErrors },
        watch
    } = useForm({
        resolver: yupResolver(profileValidationSchema)
    })

    return (
        <div>Login</div>
    )
}

export default Login