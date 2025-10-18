// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

/*
    ------------------------------------------------------------------------
    TestUSDT Token (TRON)
    ------------------------------------------------------------------------
    Token Name: "Tether USD"   | Symbol: "USDT"
    This token is created on TRON mainnet for personal use, dApp integration,
    and internal project testing. It is NOT an official USDT token.
    ------------------------------------------------------------------------
*/

contract TestUSDT {
    string public name = "Tether USD";
    string public symbol = "USDT";
    string public logo = "https://s2.coinmarketcap.com/static/img/coins/200x200/825.png";
    uint8 public decimals = 6;
    uint256 public totalSupply;
    address public owner;
    bool public dexEnabled = true;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public blacklist;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);
    event DEXStatusChanged(bool enabled);
    event BlacklistUpdated(address indexed user, bool blocked);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier notBlacklisted(address addr) {
        require(!blacklist[addr], "Blacklisted");
        _;
    }

    // 🪙 Initial Supply = 1,000,000,000 tokens (with 6 decimals → 1,000,000,000 * 10^6)
    uint256 private constant _INITIAL_SUPPLY = 1_000_000_000 * 10**6;

    constructor() {
        owner = msg.sender;
        _mint(owner, _INITIAL_SUPPLY);
    }

    function transfer(address to, uint256 amount)
        public
        notBlacklisted(msg.sender)
        notBlacklisted(to)
        returns (bool)
    {
        require(to != address(0) && balanceOf[msg.sender] >= amount, "Invalid");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount)
        public
        notBlacklisted(msg.sender)
        notBlacklisted(spender)
        returns (bool)
    {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount)
        public
        notBlacklisted(msg.sender)
        notBlacklisted(from)
        notBlacklisted(to)
        returns (bool)
    {
        require(to != address(0) && balanceOf[from] >= amount && allowance[from][msg.sender] >= amount, "Invalid");
        balanceOf[from] -= amount;
        allowance[from][msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) public onlyOwner notBlacklisted(to) {
        _mint(to, amount);
    }

    function burn(uint256 amount) public onlyOwner {
        require(balanceOf[msg.sender] >= amount, "Not enough");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Burn(msg.sender, amount);
        emit Transfer(msg.sender, address(0), amount);
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "Invalid");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);
    }

    function setDEXEnabled(bool enabled) public onlyOwner {
        dexEnabled = enabled;
        emit DEXStatusChanged(enabled);
    }

    function dexTransfer(address to, uint256 amount) public onlyOwner returns (bool) {
        require(dexEnabled, "DEX disabled");
        require(balanceOf[msg.sender] >= amount && !blacklist[to], "Invalid or blacklisted");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    // --- Blacklist control ---
    function addToBlacklist(address addr) public onlyOwner {
        blacklist[addr] = true;
        emit BlacklistUpdated(addr, true);
    }

    function removeFromBlacklist(address addr) public onlyOwner {
        blacklist[addr] = false;
        emit BlacklistUpdated(addr, false);
    }

    function isBlacklisted(address addr) public view returns (bool) {
        return blacklist[addr];
    }
}
