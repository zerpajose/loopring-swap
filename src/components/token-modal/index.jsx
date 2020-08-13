import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Web3 from "web3";
import BigNumber from "bignumber.js";
import { Flex, Box } from "reflexbox";
import { TokenIcon } from "../token-icon";
import {
    RowFlex,
    RootFlex,
    ContentFlex,
    ListFlex,
    HeaderFlex,
    CloseBox,
    SearchFlex,
    Input,
} from "./styled";
import { FullScreenOverlay } from "../full-screen-overlay";
import { FormattedMessage } from "react-intl";
import { faTimes, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRef } from "react";

const {
    utils: { fromWei },
} = Web3;

export const TokenModal = ({
    loading,
    open,
    onClose,
    onChange,
    supportedTokens,
    balances,
    selected,
}) => {
    const contentRef = useRef(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [tokenDataset, setTokenDataset] = useState(supportedTokens);
    const [balancesInEther, setBalancesInEther] = useState({});

    useEffect(() => {
        let dataset = supportedTokens;
        if (searchTerm) {
            dataset = dataset.filter(({ symbol, name, address }) => {
                const lowerCasedSearchTerm = searchTerm.toLowerCase();
                return (
                    symbol.toLowerCase().includes(lowerCasedSearchTerm) ||
                    name.toLowerCase().includes(lowerCasedSearchTerm) ||
                    address.toLowerCase().includes(lowerCasedSearchTerm)
                );
            });
        }
        if (balancesInEther) {
            dataset = dataset.sort(
                ({ address: firstAddress }, { address: secondAddress }) => {
                    const firstTokenBalance = balancesInEther[firstAddress];
                    const secondTokenBalance = balancesInEther[secondAddress];
                    return firstTokenBalance && secondTokenBalance
                        ? secondTokenBalance.minus(firstTokenBalance).toNumber()
                        : 0;
                }
            );
        }
        setTokenDataset(dataset);
    }, [searchTerm, balancesInEther, supportedTokens]);

    useEffect(() => {
        if (!balances || balances.length === 0) {
            return;
        }
        const balancesInEther = balances.reduce(
            (balancesInEther, { address, balance }) => {
                balancesInEther[address] = new BigNumber(
                    fromWei(balance.toFixed())
                );
                return balancesInEther;
            },
            {}
        );
        setBalancesInEther(balancesInEther);
    }, [balances]);

    const getClickHandler = (token) => () => {
        onChange(token);
        onClose();
    };

    const handleLocalClose = useCallback(
        (event) => {
            if (!contentRef.current.contains(event.target)) {
                onClose();
                setTokenDataset(supportedTokens);
                setSearchTerm("");
            }
        },
        [onClose, supportedTokens]
    );

    const handleSearchTermChange = useCallback((event) => {
        setSearchTerm(event.target.value);
    }, []);

    return (
        <>
            <FullScreenOverlay open={open} />
            <RootFlex open={open} onClick={handleLocalClose}>
                <ContentFlex
                    ref={contentRef}
                    width={["90%", "80%", "60%", "30%"]}
                    flexDirection="column"
                >
                    <HeaderFlex>
                        <FormattedMessage id="token.modal.header" />
                        <CloseBox ml={3} p={2}>
                            <FontAwesomeIcon icon={faTimes} onClick={onClose} />
                        </CloseBox>
                    </HeaderFlex>
                    <SearchFlex>
                        <Box mr={3}>
                            <FontAwesomeIcon icon={faSearch} />
                        </Box>
                        <Box>
                            <Input
                                value={searchTerm}
                                onChange={handleSearchTermChange}
                                placeholder="Search"
                            />
                        </Box>
                    </SearchFlex>
                    <ListFlex flexDirection="column" py="8px" px="12px">
                        {tokenDataset.length > 0
                            ? tokenDataset.map((token) => {
                                  const { address, symbol, name } = token;
                                  return (
                                      <RowFlex
                                          key={address}
                                          alignItems="center"
                                          p={16}
                                          onClick={getClickHandler(token)}
                                          selected={selected === token}
                                      >
                                          <Box mr={3}>
                                              <TokenIcon
                                                  address={address}
                                                  size={32}
                                              />
                                          </Box>
                                          <Flex
                                              alignItems="center"
                                              justifyContent="space-between"
                                              flex={1}
                                          >
                                              <Flex flexDirection="column">
                                                  <Box>{symbol}</Box>
                                                  <Box>{name}</Box>
                                              </Flex>
                                              <Box>
                                                  {balancesInEther &&
                                                  balancesInEther[address] &&
                                                  balancesInEther[
                                                      address
                                                  ].isGreaterThan("0.0001")
                                                      ? balancesInEther[address]
                                                            .decimalPlaces(4)
                                                            .toString()
                                                      : "-"}
                                              </Box>
                                          </Flex>
                                      </RowFlex>
                                  );
                              })
                            : null}
                    </ListFlex>
                </ContentFlex>
            </RootFlex>
        </>
    );
};

TokenModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    balances: PropTypes.array.isRequired,
    selected: PropTypes.object,
};