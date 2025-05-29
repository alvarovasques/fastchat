import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import TabPanel from "../../components/TabPanel";
import ChatMessages from "./ChatMessages";
import ChatList from "./ChatList";
import { i18n } from "../../translate/i18n";
import NewChat from "./NewChat";
import { Grid } from "@material-ui/core";
import Hidden from "@material-ui/core/Hidden";
import ChatInfo from "./ChatInfo";
import AIAssistantChat from "./AIAssistantChat";

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    display: "flex",
    flexDirection: "row",
    position: "relative",
    flex: 1,
    padding: theme.spacing(2),
    height: "100%",
    overflowY: "hidden",
    border: "1px solid rgba(0, 0, 0, 0.12)",
  },
  gridContainer: {
    flex: 1,
    padding: theme.spacing(1),
    height: "100%",
  },
  gridItem: {
    padding: theme.spacing(0),
  },
  chatPaper: {
    display: "flex",
    height: "100%",
  },
  contactsWrapper: {
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflowY: "hidden",
    borderRight: "1px solid rgba(0, 0, 0, 0.12)",
  },
  contactsWrapperSmall: {
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflowY: "hidden",
    borderRight: "0",
  },
  messagesWrapper: {
    display: "flex",
    height: "100%",
    flexDirection: "column",
    flexGrow: 1,
    overflowY: "hidden",
    borderRight: "1px solid rgba(0, 0, 0, 0.12)",
  },
  welcomeMsg: {
    backgroundColor: "#eee",
    display: "flex",
    justifyContent: "space-evenly",
    alignItems: "center",
    height: "100%",
    textAlign: "center",
  },
  chatInfoWrapper: {
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
  },
  chatContactsWrapper: {
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
  },
  tabRoot: {
    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
  },
}));

const Chat = () => {
  const classes = useStyles();
  const { id } = useParams();
  const [tab, setTab] = useState(0);
  const [currentChat, setCurrentChat] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      const chat = {
        id: id,
      };
      setCurrentChat(chat);
      setLoading(false);
    }
  }, [id, setCurrentChat]);

  const handleChangeTab = (event, newValue) => {
    setTab(newValue);
  };

  return (
    <div className={classes.mainContainer}>
      <Paper elevation={0} variant="outlined" className={classes.chatPaper}>
        <Grid container spacing={0}>
          <Grid item xs={4} md={4} className={classes.gridItem}>
            <Hidden only={["xs", "sm"]}>
              <div className={classes.contactsWrapper}>
                <Tabs
                  value={tab}
                  onChange={handleChangeTab}
                  indicatorColor="primary"
                  textColor="primary"
                  className={classes.tabRoot}
                >
                  <Tab label={i18n.t("chats.chats")} />
                  <Tab label={i18n.t("chats.contacts")} />
                  <Tab label="Assistente IA" />
                </Tabs>
                <TabPanel value={tab} index={0}>
                  <ChatList setCurrentChat={setCurrentChat} />
                </TabPanel>
                <TabPanel value={tab} index={1}>
                  <NewChat setCurrentChat={setCurrentChat} />
                </TabPanel>
                <TabPanel value={tab} index={2}>
                  <AIAssistantChat />
                </TabPanel>
              </div>
            </Hidden>
            <Hidden only={["md", "lg", "xl"]}>
              <div className={classes.contactsWrapperSmall}>
                {currentChat.id === undefined ? (
                  <>
                    <Tabs
                      value={tab}
                      onChange={handleChangeTab}
                      indicatorColor="primary"
                      textColor="primary"
                      className={classes.tabRoot}
                    >
                      <Tab label={i18n.t("chats.chats")} />
                      <Tab label={i18n.t("chats.contacts")} />
                      <Tab label="Assistente IA" />
                    </Tabs>
                    <TabPanel value={tab} index={0}>
                      <ChatList setCurrentChat={setCurrentChat} />
                    </TabPanel>
                    <TabPanel value={tab} index={1}>
                      <NewChat setCurrentChat={setCurrentChat} />
                    </TabPanel>
                    <TabPanel value={tab} index={2}>
                      <AIAssistantChat />
                    </TabPanel>
                  </>
                ) : (
                  <div className={classes.messagesWrapper}>
                    <ChatMessages chat={currentChat} />
                  </div>
                )}
              </div>
            </Hidden>
          </Grid>
          <Grid item xs={8} md={5} className={classes.gridItem}>
            <Hidden only={["xs", "sm"]}>
              <div className={classes.messagesWrapper}>
                {currentChat.id !== undefined ? (
                  <ChatMessages chat={currentChat} />
                ) : (
                  <div className={classes.welcomeMsg}>
                    <span>{i18n.t("chats.noTicketMessage")}</span>
                  </div>
                )}
              </div>
            </Hidden>
          </Grid>
          <Grid item md={3} className={classes.gridItem}>
            <Hidden only={["xs", "sm"]}>
              <div className={classes.chatInfoWrapper}>
                {currentChat.id !== undefined ? (
                  <ChatInfo chat={currentChat} loading={loading} />
                ) : null}
              </div>
            </Hidden>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};

export default Chat;