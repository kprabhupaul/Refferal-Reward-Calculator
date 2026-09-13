'use strict';

/*
 * Referral Reward Calculator
 *
 * Rules:
 * 1. Every user makes one initial purchase.
 * 2. A purchase gives the configured reward to each ancestor
 *    1–7 levels above the purchaser.
 * 3. Rewards are purchase credit, not cash.
 * 4. When accumulated credit reaches the product price, the user
 *    can make another product purchase.
 * 5. The product price is deducted and any remaining balance is
 *    carried forward.
 * 6. Every repeat purchase is a new purchase event and generates
 *    rewards again.
 *
 * The calculation is performed bottom-up by line, so millions of
 * individual user objects do not need to be created.
 */

const $ = (id) => document.getElementById(id);

/**
 * Convert money input to paise.
 * This avoids JavaScript floating-point money calculation issues.
 */
function parseMoneyToPaise(id) {
    const value = Number($(id).value);

    if (!Number.isFinite(value) || value < 0) {
        return 0;
    }

    return Math.round(value * 100);
}

/**
 * Read a positive integer input.
 */
function parsePositiveInt(id) {
    const value = Number($(id).value);

    return Number.isFinite(value)
        ? Math.floor(value)
        : 0;
}

/**
 * Convert paise to display currency.
 */
function moneyFromPaise(paise) {
    return `₹${(paise / 100).toFixed(2)}`;
}

/**
 * Get ordinal suffix.
 */
function ordinal(n) {
    if (n % 100 >= 11 && n % 100 <= 13) {
        return 'th';
    }

    return {
        1: 'st',
        2: 'nd',
        3: 'rd'
    }[n % 10] || 'th';
}


/**
 * Main calculation.
 */
function calculate() {

    const productPrice =
        parseMoneyToPaise('productPrice');

    const referralsPerUser =
        parsePositiveInt('referralsPerUser');

    const totalLines =
        parsePositiveInt('totalLines');


    /*
     * Rewards for levels 1–7.
     *
     * rewards[0] = Level 1 reward
     * rewards[1] = Level 2 reward
     * ...
     * rewards[6] = Level 7 reward
     */
    const rewards = Array.from(
        { length: 7 },
        (_, index) =>
            parseMoneyToPaise(`reward${index + 1}`)
    );


    /*
     * Validate basic inputs.
     */
    if (
        productPrice <= 0 ||
        referralsPerUser < 1 ||
        totalLines < 1
    ) {
        alert('Please enter valid network settings.');
        return;
    }


    /*
     * users[line]
     *
     * Number of users on that line.
     *
     * users[0] = original user (Suresh)
     *
     * Example with 2 referrals:
     *
     * L1 = 2
     * L2 = 4
     * L3 = 8
     * L4 = 16
     */
    const users =
        new Array(totalLines + 1).fill(0);


    /*
     * purchases[line]
     *
     * Number of purchases made by ONE user
     * on that line.
     *
     * Every user starts with one initial purchase.
     */
    const purchases =
        new Array(totalLines + 1).fill(1);


    /*
     * rewardGenerated[line]
     *
     * Total reward generated for ONE user
     * on this line.
     */
    const rewardGenerated =
        new Array(totalLines + 1).fill(0);


    /*
     * remainingBalance[line]
     *
     * Reward balance left after making all
     * possible purchases.
     */
    const remainingBalance =
        new Array(totalLines + 1).fill(0);


    /*
     * Original user.
     */
    users[0] = 1;


    /*
     * Build network size.
     */
    for (
        let line = 1;
        line <= totalLines;
        line++
    ) {

        users[line] =
            users[line - 1] *
            referralsPerUser;
    }


    /*
     * ---------------------------------------------------------
     * BOTTOM-UP CALCULATION
     * ---------------------------------------------------------
     *
     * We start from the deepest line and move upward.
     *
     * Why?
     *
     * A user's repeat purchases depend on purchases made
     * by users below them.
     *
     * For a user on line D:
     *
     * Level 1 descendants:
     * referralsPerUser
     *
     * Level 2 descendants:
     * referralsPerUser ^ 2
     *
     * ...
     *
     * Level 7 descendants:
     * referralsPerUser ^ 7
     *
     * Each descendant's purchases generate the configured
     * reward for the current user.
     */
    for (
        let line = totalLines;
        line >= 0;
        line--
    ) {

        let totalRewardPaise = 0;


        /*
         * Look at descendants 1 through 7 levels below.
         */
        for (
            let level = 1;
            level <= 7;
            level++
        ) {

            const descendantLine =
                line + level;


            /*
             * There are no descendants beyond
             * the configured number of lines.
             */
            if (
                descendantLine >
                totalLines
            ) {
                break;
            }


            /*
             * Number of descendants at this level
             * for ONE current-line user.
             *
             * Example:
             *
             * referrals = 2
             *
             * Level 1 = 2
             * Level 2 = 4
             * Level 3 = 8
             */
            const descendantUsersPerUser =
                referralsPerUser ** level;


            /*
             * Every descendant can make multiple purchases.
             *
             * Each purchase generates the reward configured
             * for this level.
             */
            totalRewardPaise +=
                descendantUsersPerUser *
                purchases[descendantLine] *
                rewards[level - 1];
        }


        /*
         * Store total reward generated for
         * one user on this line.
         */
        rewardGenerated[line] =
            totalRewardPaise;


        /*
         * Determine how many additional products
         * can be purchased using the reward balance.
         */
        const repeatPurchases =
            Math.floor(
                totalRewardPaise /
                productPrice
            );


        /*
         * Every user already made one initial purchase.
         *
         * Therefore:
         *
         * Total purchases =
         * Initial purchase + repeat purchases
         */
        purchases[line] =
            1 + repeatPurchases;


        /*
         * Remaining reward balance after purchases.
         *
         * This amount carries forward.
         */
        remainingBalance[line] =
            totalRewardPaise %
            productPrice;
    }


    /*
     * ---------------------------------------------------------
     * ORIGINAL USER RESULT
     * ---------------------------------------------------------
     */

    const totalNetworkUsers =
        users
            .slice(1)
            .reduce(
                (sum, count) =>
                    sum + count,
                0
            );


    const originalReward =
        rewardGenerated[0];


    const originalPurchases =
        purchases[0];


    const originalRepeatPurchases =
        originalPurchases - 1;


    const originalRemaining =
        remainingBalance[0];


    /*
     * ---------------------------------------------------------
     * UPDATE SUMMARY
     * ---------------------------------------------------------
     */

    $('totalUsers').textContent =
        totalNetworkUsers.toLocaleString('en-IN');


    $('initialPurchases').textContent =
        totalNetworkUsers.toLocaleString('en-IN');


    $('originalRewards').textContent =
        moneyFromPaise(originalReward);


    $('rewardPurchases').textContent =
        originalRepeatPurchases
            .toLocaleString('en-IN');


    /*
     * ---------------------------------------------------------
     * ORIGINAL USER DETAILS
     * ---------------------------------------------------------
     */

    $('originalResult').innerHTML = `
        <div>
            <strong>Initial purchase:</strong>
            1
        </div>

        <div>
            <strong>Reward-based purchases:</strong>
            ${originalRepeatPurchases.toLocaleString('en-IN')}
        </div>

        <div>
            <strong>Total purchases by original user:</strong>
            ${originalPurchases.toLocaleString('en-IN')}
        </div>

        <div>
            <strong>Total rewards generated for original user:</strong>
            ${moneyFromPaise(originalReward)}
        </div>

        <div>
            <strong>Unused reward balance:</strong>
            ${moneyFromPaise(originalRemaining)}
        </div>
    `;


    /*
     * ---------------------------------------------------------
     * NETWORK TABLE
     * ---------------------------------------------------------
     */

    const rows = [];


    for (
        let line = 1;
        line <= totalLines;
        line++
    ) {

        /*
         * Only the first 7 levels have configurable
         * rewards.
         *
         * Beyond level 7 the reward is zero.
         */
        const reward =
            line <= 7
                ? rewards[line - 1]
                : 0;


        rows.push(`
            <tr>

                <td>
                    ${line}${ordinal(line)} Line
                </td>

                <td>
                    ${users[line]
                        .toLocaleString('en-IN')}
                </td>

                <td>
                    ${moneyFromPaise(reward)}
                </td>

                <td>
                    ${purchases[line]
                        .toLocaleString('en-IN')}
                </td>

                <td>
                    ${moneyFromPaise(
                        rewardGenerated[line]
                    )}
                </td>

                <td>
                    ${moneyFromPaise(
                        remainingBalance[line]
                    )}
                </td>

            </tr>
        `);
    }


    $('networkTable').innerHTML =
        rows.join('');


    /*
     * ---------------------------------------------------------
     * CALCULATION NOTES
     * ---------------------------------------------------------
     */

    const configuredRewardTotal =
        rewards.reduce(
            (sum, value) =>
                sum + value,
            0
        );


    $('calculationNotes').innerHTML = `
        <div>
            Product price:
            <strong>
                ${moneyFromPaise(productPrice)}
            </strong>
        </div>

        <div>
            Direct referrals per user:
            <strong>
                ${referralsPerUser}
            </strong>
        </div>

        <div>
            Total calculation lines:
            <strong>
                ${totalLines}
            </strong>
        </div>

        <div>
            Configured rewards across levels 1–7:
            <strong>
                ${moneyFromPaise(
                    configuredRewardTotal
                )}
            </strong>
            per purchase when all 7 levels exist.
        </div>

        <div>
            Rewards are accumulated as purchase credit,
            not cash.
        </div>

        <div>
            Any balance below the product price is
            carried forward.
        </div>

        <div>
            Every reward-based purchase is treated as
            a new purchase and generates rewards again.
        </div>
    `;


    /*
     * Show results.
     */
    $('results').classList.remove('hidden');
}


/*
 * Calculate button.
 */
$('calculateBtn')
    .addEventListener(
        'click',
        calculate
    );
