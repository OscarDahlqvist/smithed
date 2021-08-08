import React from 'react';
import logo from './logo.svg';
import styled from 'styled-components';
import '../font.css'
import { ColumnDiv, firebaseUser, Header1, Header2, Header3,  MarkdownOptions, RowDiv, setFirebaseUser, setIgnoreStateChange, TabButton } from '..';
import curPalette from '../Palette';
import {firebaseApp} from '../index'
import firebase from 'firebase';
import {fs, pathModule, settingsFolder} from '../Settings'
import { off } from 'process';
const emailRegex = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
const strongRegex = new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/);


const LoginContainer = styled.div`
  position: absolute;
  top: 25px;
  bottom: 0;
  width: 100%;
  display: flex;
  overflow: clip;
  background-color: ${curPalette.lightBackground};
  align-items: center;
  flex-direction: column;
`

const ErrorLabel = styled.label`
  color: red;
  font-family: Consolas;
`

const LoginInput = styled.input`
    height: 24px;
    padding: 4px;
    width: 50%;
    font-family: Consolas;
    border-radius: 4px;
    border: 2px solid ${curPalette.darkAccent};
    color: ${curPalette.text};
    background-color: ${curPalette.darkBackground};
    &::placeholder {
        color: ${curPalette.subText};
    }
`

const LoginButton = styled.button`
    height:32px;
    width:128px;
    color:${curPalette.text};
    background-color:${curPalette.lightAccent};
    font-size:20px;
    border: none;
    font-family: Disket-Bold;

    :hover {
        filter: brightness(85%);
    }
    :active {
        filter: brightness(75%);
    }
`

interface LoginProps {
    onSuccess: () => void;
}

class Login extends React.Component {
    state: {tab: number, [key:string]: any}
    email: string = ''
    password: string = ''
    password2: string = ''
    displayName: string = ''
    props: LoginProps
    constructor(props: LoginProps) {
        super(props)
        this.props = props
        this.state = {tab:0,page:'main'}
    }

    validate(): boolean {
        let valid: boolean = true
        if(!this.email.match(emailRegex) && this.email != '') {
            this.setState({emailValid: false})
            valid = false
        } else {
            if(this.email == '') valid = false
            this.setState({emailValid: true})
        }
        if(!this.password.match(strongRegex) && this.password != '') {
            this.setState({passwordValid: false})
            valid = false
        } else {
            if(this.password == '') valid = false
            this.setState({passwordValid: true})
        }
        if(this.password != this.password2 && this.password2 != '') {
            this.setState({password2Valid: false})
            valid = false
        } else {
            if(this.password2 == '') valid = false
            this.setState({password2Valid: true})
        }

        return valid
    }

    signUp() {

        if(!this.validate()) return;
       
        setIgnoreStateChange(true)
        firebaseApp.auth().createUserWithEmailAndPassword(this.email, this.password)
        .then((userCredential) => {
            // Signed in 
            var user = userCredential.user;
            if(user != null) {
                setFirebaseUser(user)
                this.setState({page:'finish-setup'})
                //
            }
        })
        .catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
            // ..
            console.log(errorCode)
            switch(errorCode) {
                case 'auth/email-already-in-use': {
                    this.setState({loginError:'That email is in use!'})
                    break
                }
                default: {
                    this.setState({loginError: errorCode})
                }
            }
        });

    }
    signIn() {
        firebaseApp.auth().signInWithEmailAndPassword(this.email, this.password).then((userCredential)=>{
            var user = userCredential.user;
            if(user != null) {
                setFirebaseUser(user)
                this.props.onSuccess()
            }
        }).catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
            // ..
            console.log(errorCode)
            switch(errorCode) {
                case 'auth/user-disabled': {
                    this.setState({loginError:'That user has been disabled!'})
                    break
                }
                case 'auth/user-not-found': {
                    this.setState({loginError:'No account has been registered with that email!'})
                    break
                }
                case 'auth/wrong-password': {
                    this.setState({loginError:'Incorrect password or email!'})
                    break
                }
                default: {
                    this.setState({loginError: errorCode})
                }
            }
        })
    }
    
    swapTab(tab: number) {
        if(tab != this.state.tab) {
            this.setState({tab: tab, emailValid:null, passwordValid: null, password2Valid: null, loginError: null})
            this.email = ''
            this.password = ''
            this.password2 = ''
        }
    }
    getSelectedStyle(tab: number) : React.CSSProperties {
        if(this.state.tab == tab) {
            return {
                marginTop: 4,
                borderBottom: `4px solid ${curPalette.lightAccent}`
            }
        } else {
            return {}
        }
    }
    renderEmailField() {
        return(
            <ColumnDiv style={{width:'100%', gap:4}}>
                {this.state.emailValid == null || this.state.emailValid == false && <ErrorLabel>Invalid email!</ErrorLabel>}
                <LoginInput type="email" onChange={(e) => {
                    let input = e.target as HTMLInputElement
                    this.email = input.value
                    this.validate()
                }} placeholder='Email'/>
            </ColumnDiv>
        )
    }
    renderDisplayNameField() {
        return(
            <ColumnDiv style={{width:'100%', gap:4}}>
                {this.state.displayNameValid == null || this.state.displayNameValid == false && <ErrorLabel>Invalid display name! Must be between 3 and 15 characters!</ErrorLabel>}
                {this.state.displayNameValid2 == null || this.state.displayNameValid2 == false && <ErrorLabel>Name taken!</ErrorLabel>}

                <LoginInput type="email" onChange={async (e) => {
                    let input = e.target as HTMLInputElement
                    this.displayName = input.value;
                    
                    if(this.displayName.length < 3 || this.displayName.length > 15)
                        this.setState({displayNameValid: false})
                    else
                        this.setState({displayNameValid: true})

                    const db = firebaseApp.database()
                    const ref = db.ref('users/')

                    let snapshot = await ref.get()
                    let users : {[key: string]: {displayName: string}} = snapshot.val()
                    for(let u in users) {
                        if(users[u].displayName == this.displayName) {
                            this.setState({displayNameValid2: false})
                            return;
                        }
                    }
                    this.setState({displayNameValid2: true})

                }} placeholder='Display Name'/>
            </ColumnDiv>
        )
    }
    renderPasswordField() {
        return(
            <ColumnDiv style={{width:'100%', gap:4}}>
                {this.state.passwordValid == null || this.state.passwordValid == false && <ErrorLabel>Password must contain 1 lowercase, 1 uppercase, 1 symbol, 1 number, and be at least 8 characters</ErrorLabel>}
                <LoginInput type="password" onChange={(e) => {
                    let input = e.target as HTMLInputElement
                    this.password = input.value
                    if(this.state.tab == 0)
                        this.validate()
                }} placeholder='Password'/>
            </ColumnDiv>
        )
    }
    renderPassword2Field() {
        return(
            <ColumnDiv style={{width:'100%', gap:4}}>
                {this.state.password2Valid == null || this.state.password2Valid == false && <ErrorLabel>Passwords do not match!</ErrorLabel>}
                <LoginInput type="password" onChange={(e) => {
                    let input = e.target as HTMLInputElement
                    this.password2 = input.value
                    this.validate()
                }} placeholder='Re-enter password'/>
            </ColumnDiv>
        )
    }

    renderSignUp() {
        return (
            <ColumnDiv style={{width:'50%', gap:16, padding:24}}>
                {this.renderEmailField()}
                {this.renderPasswordField()}
                {this.renderPassword2Field()}
                {this.state.loginError != null && <ErrorLabel>{this.state.loginError}</ErrorLabel>}
                <LoginButton onClick={()=>this.signUp()}>Register</LoginButton>
            </ColumnDiv>
        );
    }
    renderSignIn() {
        return (
            <ColumnDiv style={{width:'50%', gap:16, padding:24}}>
                {this.renderEmailField()}
                {this.renderPasswordField()}
                {this.state.loginError != null && <ErrorLabel>{this.state.loginError}</ErrorLabel>}
                <LoginButton onClick={()=>this.signIn()}>Login</LoginButton>
            </ColumnDiv>
        );
    }
    renderMain() {
        return(
            <ColumnDiv style={{width:'100%'}}>
                <RowDiv style={{backgroundColor:curPalette.darkBackground, width:'100%', height:'30px',justifyContent:'center',gap:36}}>
                    <TabButton style={this.getSelectedStyle(0)} onClick={()=>this.swapTab(0)}>Sign Up</TabButton>
                    <TabButton style={this.getSelectedStyle(1)} onClick={()=>this.swapTab(1)}>Sign In</TabButton>
                </RowDiv>
                {this.state.tab == 0 && this.renderSignUp()}
                {this.state.tab == 1 && this.renderSignIn()}
            </ColumnDiv>
        )
    }
    renderSetup() {
        return(
            <ColumnDiv style={{padding:24, width:'50%', gap:8}}>
                {this.renderDisplayNameField()}
                <RowDiv style={{gap:8}}>
                    <LoginButton onClick={() => {
                        if(firebaseUser != null) {
                            firebaseApp.database().ref(`users/${firebaseUser.uid}`).remove()
                            firebaseUser.delete()
                        }
                        this.setState({page:'main'})
                    }}>Cancel</LoginButton>
                    <LoginButton onClick={async ()=>{

                        if(this.displayName.length < 3 || this.displayName.length > 15) return;
                        if(firebaseUser == null) return;

                        firebaseApp.database().ref(`users/${firebaseUser.uid}/displayName`).set(this.displayName)

                        this.props.onSuccess()
    
                    }}>Finish</LoginButton>
                </RowDiv>
            </ColumnDiv>
        )
    }
    render() {

        return (
            <LoginContainer>
                {this.state.page == 'main' && this.renderMain()}
                {this.state.page == 'finish-setup' && this.renderSetup()}
            </LoginContainer>
        );
    }
}

export default Login;