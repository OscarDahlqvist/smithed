import React from 'react';
import styled from 'styled-components';
import '../font.css'
import { ColumnDiv, firebaseApp, Header1, Header2, Header3, TabButton, StyledInput, firebaseUser, RowDiv, userData, StyledButton, StyledLabel } from '..';
import PackDisplay from '../components/PackDisplay';
import { PackDict, PackEntry } from './Browse';
import { Enumerable } from 'linq-es5/lib/enumerable';
import * as linq from 'linq-es5'
import { getPack } from '../UserData';
import GroupedFoldout from '../components/GroupedFoldout';
import curPalette from '../Palette';
import { PackHelper } from '../Pack';
const {Webhook} = window.require('simple-discord-webhooks');

function QueueEntry(props: any) {
    return (
        <GroupedFoldout text={props.id} group="queue" style={{width:'95%'}}>
            <ColumnDiv style={{gap:8}}>
                {props.data.display !== 'hidden' && <div>
                    <StyledLabel style={{}}><b style={{fontSize:18}}>Description: </b> {props.data.display.description < 400 ? props.data.display.description : props.data.display.description.substring(0, 400) + '...'}</StyledLabel>
                </div>}
                <RowDiv style={{gap:8, marginTop:8}}>
                    <StyledButton style={{backgroundColor:curPalette.lightBackground}}>Reject</StyledButton>
                    <StyledButton onClick={()=>{
                        PackHelper.movePackFromQueue(props.id, () => {
                            Queue.instance.renderQueue()
                            if(userData.discordWebhook != null) {
                                if(userData.discordWebhook != null) {
                                    const pack = props.data
                                    const webhook = new Webhook(userData.discordWebhook)
                                    const date = new Date(Date.now())
                                    firebaseApp.database().ref(`users/${props.owner}/displayName`).get().then((snapshot) => {
                                        const authorName = snapshot.val()
                                        webhook.send('**A new pack has been approved!**', [{
                                            title: `\`\`${pack.display !== 'hidden' ? pack.display.name : pack.id}\`\` by \`\`${authorName}\`\``,
                                            type: "rich",
                                            timestamp: `${date.toISOString()}`,
                                            description: `${pack.display !== 'hidden' ? (
                                                pack.display.description.length < 300 ? pack.display.description : pack.display.description.substring(0, 300) + '...'
                                            ) : 'No Description'}`,
                                            image: pack.display !== 'hidden' ? {
                                                url:  pack.display.icon,
                                                width: 32,
                                                height: 32
                                            } : null,
                                            color: 1788100,
                                            footer: {
                                                text: `Approved by: ${userData.displayName}`
                                            }
                                        }])
                                    })
                                }
                            }
                        })
                    }}>Accept</StyledButton>
                </RowDiv>
            </ColumnDiv>
        </GroupedFoldout>
    )
}

class Queue extends React.Component {
    state: {[key: string]: any}
    static instance: Queue
    constructor(props: any) {
        super(props)
        this.state = {}
        Queue.instance = this
    }

    componentDidMount() {
        this.renderQueue()
    }

    async getQueueAsList(): Promise<Enumerable<PackEntry>> {
        let queueDict: PackDict = (await firebaseApp.database().ref('queue').get()).val()
        let queueList: PackEntry[] = []

        for(let id in queueDict) {
            queueList.push({
                owner: queueDict[id].owner,
                added: queueDict[id].added,
                id: id,
                data: await getPack(queueDict[id], id)
            })
        }

        return linq.asEnumerable(queueList)
    }

    async renderQueue() {

        let packDisplays: JSX.Element[] = []
        
        let queue = await this.getQueueAsList()

        let packs = queue.OrderBy(p => p.added)

        const length = packs.Count()

        for(let i = 0; i < length; i++) {
            let pack = packs.ElementAt(i)
            
            packDisplays.push(<QueueEntry id={pack.id} owner={pack.owner} key={pack.id} data={pack.data}/>)
        }


        this.setState({queue: packDisplays})
    }

    render() {
        return (
            <ColumnDiv style={{flexGrow:1, width:'100%'}}>
                <RowDiv style={{width:'100%', height:'100%', marginTop:16}}>
                    <ColumnDiv style={{flex:'25%'}}>
                    </ColumnDiv>
                    <div style={{flex:'50%'}}>
                        <ColumnDiv style={{display:'inline-flex',gap:8, overflowY:'auto', overflowX:'visible', width:'100%', height:'100%'}}>
                            {this.state.queue}
                        </ColumnDiv>
                    </div>
                    <div style={{flex:'25%'}}></div>
                </RowDiv>
                
            </ColumnDiv>
        );
    }
}

export default Queue;
